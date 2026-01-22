import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { AuthDevice } from '../types/database';

const REQUEST_TIMEOUT_MS = 20000;

const parseResponseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const withTimeout = async <T>(
  fn: (signal: AbortSignal) => Promise<T>
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
};

// Define User type (previously from @supabase/supabase-js)
export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at?: string;
  [key: string]: any;
}

// Ensure the environment variables are defined
const FINAL_SUPABASE_URL = SUPABASE_URL || process.env.SUPABASE_URL;
const FINAL_SUPABASE_ANON_KEY =
  SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!FINAL_SUPABASE_URL || !FINAL_SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL and Anon Key must be defined');
}

// Session management
let currentSession: {
  access_token: string;
  refresh_token: string;
  user: User;
} | null = null;

// Helper function to make authenticated API calls using fetch
const supabaseRequest = async (
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ ok: boolean; status: number; data: any }> => {
  console.log('supabaseRequest called with endpoint:', endpoint);

  const session = await getSession();
  console.log('Session retrieved:', session ? 'exists' : 'none');

  const headers: Record<string, string> = {
    apikey: FINAL_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const url = `${FINAL_SUPABASE_URL}${endpoint}`;
  console.log('Making fetch request to:', url);
  console.log('With method:', options.method || 'GET');
  console.log('With headers:', JSON.stringify(headers, null, 2));

  try {
    const requestBody =
      options.body !== undefined ? JSON.stringify(options.body) : undefined;

    if (options.body !== undefined) {
      console.log('Request body:', JSON.stringify(options.body, null, 2));
    }

    console.log('Initiating fetch request...');
    const response = await withTimeout((signal) =>
      fetch(url, {
        method: options.method || 'GET',
        headers,
        body: requestBody,
        signal,
      })
    );
    const data = await parseResponseBody(response);
    console.log('Response received! Status:', response.status);
    console.log(
      'Response headers:',
      JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)
    );
    console.log('Response data:', JSON.stringify(data, null, 2));

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error: any) {
    console.error('Request failed with error:', error);
    console.error('Error type:', typeof error);
    console.error('Error keys:', Object.keys(error));
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

// Auth functions
export const authApi = {
  async getSession(): Promise<{
    access_token: string;
    refresh_token: string;
    user: User;
  } | null> {
    try {
      const sessionData = await AsyncStorage.getItem('supabase.auth.token');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        currentSession = session;
        return session;
      }
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  async signIn(
    email: string,
    password: string
  ): Promise<{ data: any; error: any }> {
    try {
      const response = await withTimeout((signal) =>
        fetch(`${FINAL_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            apikey: FINAL_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          signal,
        })
      );
      const data = await parseResponseBody(response);
      if (!response.ok) {
        return { data: null, error: data };
      }

      // Save session
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      };
      await AsyncStorage.setItem(
        'supabase.auth.token',
        JSON.stringify(session)
      );
      currentSession = session;

      return { data: session, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  async signUp(
    email: string,
    password: string,
    metadata?: any
  ): Promise<{ data: any; error: any }> {
    try {
      const response = await withTimeout((signal) =>
        fetch(`${FINAL_SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            apikey: FINAL_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            data: metadata,
          }),
          signal,
        })
      );
      const data = await parseResponseBody(response);
      if (!response.ok) {
        return { data: null, error: data };
      }
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  async signOut(): Promise<{ error: any }> {
    try {
      await AsyncStorage.removeItem('supabase.auth.token');
      currentSession = null;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async resetPasswordForEmail(email: string): Promise<{ error: any }> {
    try {
      const response = await withTimeout((signal) =>
        fetch(`${FINAL_SUPABASE_URL}/auth/v1/recover`, {
          method: 'POST',
          headers: {
            apikey: FINAL_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
          signal,
        })
      );
      if (!response.ok) {
        const data = await parseResponseBody(response);
        return { error: data };
      }
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  // Auth state change listener (simplified for REST API)
  onAuthStateChange(callback: (event: string, session: any) => void): {
    data: { subscription: { unsubscribe: () => void } };
  } {
    // In a REST API implementation, we can't have realtime auth state changes
    // This is a simplified version that checks session on app load
    let interval: NodeJS.Timeout | undefined;

    const checkSession = async () => {
      const session = await authApi.getSession();
      if (session) {
        callback('SIGNED_IN', session);
      } else {
        callback('SIGNED_OUT', null);
      }
    };

    // Check immediately
    checkSession();

    // Optionally, poll for session changes (not recommended for production)
    // interval = setInterval(checkSession, 60000); // Check every minute

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            if (interval) clearInterval(interval);
          },
        },
      },
    };
  },
};

// Database query builder
class QueryBuilder {
  private table: string;
  private selectQuery: string = '*';
  private filters: string[] = [];
  private singleResult: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*'): this {
    this.selectQuery = columns;
    return this;
  }

  eq(column: string, value: any): this {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  single(): this {
    this.singleResult = true;
    return this;
  }

  maybeSingle(): this {
    this.singleResult = true;
    return this;
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      let url = `/rest/v1/${this.table}?select=${this.selectQuery}`;
      if (this.filters.length > 0) {
        url += '&' + this.filters.join('&');
      }

      console.log('Executing query:', url);
      const response = await supabaseRequest(url);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (!response.ok) {
        console.error(
          'Response not OK. Status:',
          response.status,
          'Data:',
          response.data
        );
        return {
          data: null,
          error: response.data || {
            message: 'Request failed',
            status: response.status,
          },
        };
      }

      const data = response.data;

      if (this.singleResult) {
        const result = Array.isArray(data) ? data[0] : data;
        console.log('Returning single result:', result);
        return { data: result || null, error: null };
      }

      console.log('Returning data:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Execute error:', error);
      return {
        data: null,
        error: { message: error.message, stack: error.stack },
      };
    }
  }

  async insert(values: any): Promise<{ data: any; error: any }> {
    try {
      const response = await supabaseRequest(`/rest/v1/${this.table}`, {
        method: 'POST',
        body: values,
        headers: {
          Prefer: 'return=representation',
        },
      });

      if (!response.ok) {
        return { data: null, error: response.data };
      }

      const data = response.data;
      return { data: data[0] || data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async update(values: any): Promise<{ data: any; error: any }> {
    try {
      let url = `/rest/v1/${this.table}`;
      if (this.filters.length > 0) {
        url += '?' + this.filters.join('&');
      }

      const response = await supabaseRequest(url, {
        method: 'PATCH',
        body: JSON.stringify(values),
        headers: {
          Prefer: 'return=representation',
        },
      });

      if (response.status === 204) {
        return { data: null, error: null };
      }

      if (!response.ok) {
        return { data: null, error: response.data };
      }

      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Database API
export const databaseApi = {
  from(table: string): any {
    const builder = new QueryBuilder(table);

    const createChainableEq = () => ({
      eq: (column: string, value: any) => {
        builder.eq(column, value);
        return {
          ...createChainableEq(),
          single: () => {
            builder.single();
            return builder.execute();
          },
          maybeSingle: () => {
            builder.maybeSingle();
            return builder.execute();
          },
          then: (resolve: any, reject: any) =>
            builder.execute().then(resolve, reject),
        };
      },
      single: () => {
        builder.single();
        return builder.execute();
      },
      maybeSingle: () => {
        builder.maybeSingle();
        return builder.execute();
      },
      then: (resolve: any, reject: any) =>
        builder.execute().then(resolve, reject),
    });

    return {
      select: (columns?: string) => {
        builder.select(columns);
        return createChainableEq();
      },
      insert: (values: any) => builder.insert(values),
      update: (values: any) => {
        return {
          eq: (column: string, value: any) => {
            builder.eq(column, value);
            return builder.update(values);
          },
        };
      },
    };
  },
};

// Helper to get session
async function getSession() {
  return await authApi.getSession();
}

// Export a unified API similar to supabase client
export const supabaseRest = {
  auth: authApi,
  from: databaseApi.from,
};

// Helper function to check if Supabase connection is working
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const response = await withTimeout((signal) =>
      fetch(`${FINAL_SUPABASE_URL}/auth/v1/health`, {
        method: 'GET',
        headers: {
          apikey: FINAL_SUPABASE_ANON_KEY,
        },
        signal,
      })
    );
    console.log('Supabase connection test status:', response.status);
    return true;
  } catch (error: any) {
    console.error('Error testing Supabase connection:', error);
    return false;
  }
};

// Verify device code function
export const verifyDeviceCode = async (
  deviceCode: string
): Promise<{
  success: boolean;
  error?: string;
  device?: AuthDevice;
}> => {
  try {
    console.log('Verifying device code in Supabase REST service:', deviceCode);

    // Check Supabase connection before attempting to verify
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.log('Supabase connection is unavailable');
      return {
        success: false,
        error:
          'No connection to server. Please check your internet connection and try again.',
      };
    }
    console.log('Supabase connection is available');

    // First verify the code format
    if (!/^[A-Z0-9]{6,12}$/.test(deviceCode)) {
      console.log('Device code format validation failed');
      return {
        success: false,
        error: 'Invalid device code format',
      };
    }

    console.log('Querying Supabase REST API for device code');
    const { data, error } = await supabaseRest
      .from('auth_devices')
      .select('*')
      .eq('device_code', deviceCode)
      .eq('status', 'inactive')
      .maybeSingle();

    console.log('Query complete. Data:', data, 'Error:', error);

    if (error) {
      console.error('Error from Supabase REST API:', error);
      return {
        success: false,
        error: 'Failed to verify device code',
      };
    }

    if (!data) {
      console.log('No device found with this code');
      return {
        success: false,
        error: 'Invalid or inactive device code',
      };
    }

    // Update the device status
    const { error: updateError } = await supabaseRest
      .from('auth_devices')
      .update({ status: 'active' })
      .eq('id', data.id);

    if (updateError) {
      console.warn('Failed to update device status', updateError);
    }

    console.log('Device verification successful');
    return {
      success: true,
      device: data as AuthDevice,
    };
  } catch (error: any) {
    console.error('Unexpected error in verifyDeviceCode:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

// Guest information interfaces
interface SupabaseGuestResponse {
  group_size: number;
  guest: {
    full_name: string;
    phone_number: string;
  };
}

export interface GuestInfo {
  full_name: string;
  phone_number: string;
  group_size: number;
}

export const fetchGuestInformation = async (
  access_code: string,
  resident_id: string
): Promise<{ success: boolean; data?: GuestInfo; error?: string }> => {
  try {
    console.log('Fetching guest information with:', {
      access_code,
      resident_id,
    });

    const { data, error } = await supabaseRest
      .from('visitor_access_codes')
      .select(
        `
        group_size,
        guest:guest_id (
          full_name,
          phone_number
        )
      `
      )
      .eq('code', access_code)
      .eq('resident_id', resident_id)
      .single();

    if (error) {
      console.error('Error fetching guest information:', error);
      return {
        success: false,
        error: 'Failed to fetch guest information',
      };
    }

    console.log('Received data from Supabase:', JSON.stringify(data, null, 2));

    if (!data) {
      return {
        success: false,
        error: 'No data found',
      };
    }

    const response = data as any;
    if (!response.guest || typeof response.guest !== 'object') {
      return {
        success: false,
        error: 'No guest information found',
      };
    }

    if (!response.guest.full_name || !response.guest.phone_number) {
      return {
        success: false,
        error: 'Incomplete guest information',
      };
    }

    return {
      success: true,
      data: {
        full_name: response.guest.full_name,
        phone_number: response.guest.phone_number,
        group_size: response.group_size || 1,
      },
    };
  } catch (error) {
    console.error('Unexpected error fetching guest information:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

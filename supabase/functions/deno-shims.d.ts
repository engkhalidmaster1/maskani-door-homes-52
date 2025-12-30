declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: any) => any): any;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(...args: any[]): any;
  export const createServerComponentClient: any;
  // Generic supabase-js placeholder
  const supabase: any;
  export default supabase;
}

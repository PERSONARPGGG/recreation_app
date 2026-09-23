import { createClient } from '@supabase/supabase-js';

/**
 * 환경 변수에서 Supabase 연결 정보를 가져옵니다.
 * 이 값들은 프로젝트 루트의 .env 파일에 정의되어 있어야 합니다.
 * VITE_ 접두사가 붙은 환경 변수만 브라우저에서 접근할 수 있습니다.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance = null;

// 환경 변수가 올바르게 설정되어 있는 경우에만 Supabase 클라이언트를 초기화합니다.
if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("⚠️ Supabase 환경 변수가 누락되었습니다. .env 파일을 확인해주세요.");
}

/**
 * 초기화된 Supabase 클라이언트 인스턴스.
 * 데이터베이스 쿼리나 실시간(Realtime) 구독 시 사용됩니다.
 * 설정되지 않은 경우 null을 반환합니다.
 */
export const supabase = supabaseInstance;

/**
 * Supabase가 성공적으로 설정되었는지 여부를 나타내는 불리언(boolean) 값입니다.
 * 앱 전역에서 Supabase 연결 상태를 확인할 때 유용하게 쓰입니다.
 */
export const isSupabaseConfigured = !!supabaseInstance;

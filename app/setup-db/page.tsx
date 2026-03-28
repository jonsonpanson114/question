// Database Setup Page
'use client';

import { useState, useEffect } from 'react';

export default function SetupDatabasePage() {
  const [dbStatus, setDbStatus] = useState<{
    initialized: boolean;
    tables: string[];
    database_url: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/init-db');
      const data = await response.json();

      if (response.ok) {
        setDbStatus(data);
      } else {
        setError(data.error || 'Failed to check database status');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDatabase = async () => {
    setIsInitializing(true);
    setError(null);
    setInitResult(null);

    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add setup key if in production
          ...(process.env.NODE_ENV === 'production' && {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SETUP_KEY || ''}`,
          }),
        },
      });

      const data = await response.json();

      if (response.ok) {
        setInitResult(data);
        // Refresh status after successful initialization
        setTimeout(checkDatabaseStatus, 1000);
      } else {
        setError(data.error || 'Failed to initialize database');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--dojo-paper, #F5EEE8)',
      minHeight: '100vh',
      padding: '2rem 1rem',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
          color: 'var(--dojo-ink, #2C3E5C)',
        }}>
          データベースセットアップ
        </h1>

        {/* Database URL Status */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
        }}>
          <h2 style={{
            fontSize: '1rem',
            marginBottom: '0.5rem',
            color: 'var(--dojo-ink, #2C3E5C)',
          }}>
            環境変数の状態
          </h2>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {isLoading ? (
              <p>確認中...</p>
            ) : dbStatus ? (
              <>
                <p>Database URL: {dbStatus.database_url}</p>
                <p>
                  テーブル: {dbStatus.tables.length > 0 ? dbStatus.tables.join(', ') : 'なし'}
                </p>
              </>
            ) : (
              <p>不明</p>
            )}
          </div>
        </div>

        {/* Initialization Status */}
        {dbStatus && (
          <div style={{
            backgroundColor: dbStatus.initialized ? '#E8F5E9' : '#FFF3E0',
            border: `1px solid ${dbStatus.initialized ? '#4CAF50' : '#FF9800'}`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <h2 style={{
              fontSize: '1rem',
              marginBottom: '0.5rem',
              color: dbStatus.initialized ? '#2E7D32' : '#E65100',
            }}>
              {dbStatus.initialized ? '✓ データベースは初期化済み' : '⚠ データベースの初期化が必要'}
            </h2>
            {dbStatus.tables.length > 0 && (
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                既存のテーブル: {dbStatus.tables.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Initialize Button */}
        {!dbStatus?.initialized && (
          <button
            onClick={initializeDatabase}
            disabled={isInitializing}
            style={{
              backgroundColor: '#2C3E5C',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: isInitializing ? 'not-allowed' : 'pointer',
              opacity: isInitializing ? 0.6 : 1,
              width: '100%',
            }}
          >
            {isInitializing ? '初期化中...' : 'データベースを初期化する'}
          </button>
        )}

        {/* Initialization Result */}
        {initResult && (
          <div style={{
            backgroundColor: '#E8F5E9',
            border: '1px solid #4CAF50',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <h3 style={{
              fontSize: '1rem',
              marginBottom: '0.5rem',
              color: '#2E7D32',
            }}>
              ✓ 初期化完了
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#333' }}>
              {initResult.results && initResult.results.map((result: string, i: number) => (
                <p key={i} style={{ margin: '0.25rem 0' }}>{result}</p>
              ))}
            </div>
            {initResult.instructions && (
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem', fontStyle: 'italic' }}>
                {initResult.instructions}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#FFEBEE',
            border: '1px solid #F44336',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <p style={{ fontSize: '0.875rem', color: '#C62828' }}>{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1rem',
          marginTop: '2rem',
        }}>
          <h3 style={{
            fontSize: '1rem',
            marginBottom: '0.75rem',
            color: 'var(--dojo-ink, #2C3E5C)',
          }}>
            セットアップ手順
          </h3>
          <ol style={{
            fontSize: '0.875rem',
            color: '#333',
            paddingLeft: '1.25rem',
            lineHeight: '1.6',
          }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <a
                href="https://console.neon.tech"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2C3E5C' }}
              >
                Neonコンソール
              </a>
              {' '}でアカウントを作成
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              新しいプロジェクトを作成（無料プランでOK）
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              接続文字列をコピー（`Connection Details`タブ）
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              `.env.local`ファイルの`DATABASE_URL`に接続文字列を貼り付け
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              このページをリロードして「データベースを初期化する」をクリック
            </li>
          </ol>

          <h4 style={{
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
            marginTop: '1rem',
            color: 'var(--dojo-ink, #2C3E5C)',
          }}>
            現在の環境変数の状態
          </h4>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '0.75rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            overflow: 'auto',
          }}>
{`DATABASE_URL=${process.env.DATABASE_URL ? '✓ 設定済み' : '✗ 未設定'}
VAPID_PUBLIC_KEY=${process.env.VAPID_PUBLIC_KEY ? '✓ 設定済み' : '✗ 未設定'}
VAPID_PRIVATE_KEY=${process.env.VAPID_PRIVATE_KEY ? '✓ 設定済み' : '✗ 未設定'}
CRON_SECRET=${process.env.CRON_SECRET ? '✓ 設定済み' : '✗ 未設定'}`}
          </pre>
        </div>

        {/* Back link */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a
            href="/practice"
            style={{
              color: 'var(--dojo-ink, #2C3E5C)',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            ← 練習ページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}

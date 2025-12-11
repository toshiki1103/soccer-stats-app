import './globals.css';

export const metadata = {
  title: 'Soccer Stats Beta',
  description: 'Real-time soccer match statistics recorder',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50">
        <div className="w-full max-w-2xl mx-auto bg-white min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

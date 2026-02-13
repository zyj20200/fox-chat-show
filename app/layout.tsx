import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "灵狐聊天记录",
  description: "聊天历史记录查看器",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

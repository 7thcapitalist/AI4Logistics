export const metadata = {
  title: "AI4Logistics",
  description: "Compliance and operations for small transportadoras",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

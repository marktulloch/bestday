import Footer from "@/app/components/layout/Footer";
import Header from "@/app/components/layout/Header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 pt-14 sm:pt-16 md:pt-[4.25rem]">{children}</main>
      <Footer />
    </>
  );
}

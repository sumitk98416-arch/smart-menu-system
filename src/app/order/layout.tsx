import { CartProvider } from '@/hooks/useCart';

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}

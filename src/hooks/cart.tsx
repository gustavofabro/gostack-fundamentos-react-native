import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const items = await AsyncStorage.getItem('@GoMarketplace:products');

      if (items) {
        setProducts(JSON.parse(items) as Product[]);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    saveProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const newProducts = [...products];
      const index = products.findIndex(item => item.id === product.id);

      if (index > -1) {
        newProducts[index] = {
          ...product,
          quantity: newProducts[index].quantity + 1,
        };
      } else {
        newProducts.push({
          ...product,
          quantity: 1,
        });
      }

      setProducts(newProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const index = products.findIndex(item => item.id === id);
      const newProducts = [...products];

      newProducts[index].quantity = products[index].quantity + 1;

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(item => item.id === id);
      const newQuantity = products[index].quantity - 1;
      let newProducts = [...products];

      if (newQuantity < 1) {
        newProducts = products.filter(item => item.id !== id);
      } else {
        newProducts[index].quantity = newQuantity;
      }

      setProducts(newProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

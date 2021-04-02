import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const foundProduct = cart.find(p => p.id === productId);
      
      if (foundProduct) {
        const amount = foundProduct.amount + 1;
        updateProductAmount({ productId, amount });
        return;
      }
      
      const { data: product } = await api.get<Product>(`/products/${productId}`);
      product.amount = 1;

      const newCart = [...cart, product];

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch(e) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const foundCart = cart.some(p => p.id === productId);
      
      if(!foundCart){
        throw new Error('Erro na remoção do produto');
      }

      const newCart = cart.filter(p => p.id !== productId);
      
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch(e) {
      toast.error(e.message);
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      const prodIndex = cart.findIndex(p => p.id === productId);
      if (prodIndex === -1) throw new Error('Erro na alteração de quantidade do produto');

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (amount > stock.amount || !amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = [...cart];
      newCart[prodIndex].amount = amount;
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch(e) {
      toast.error(e.message || 'Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

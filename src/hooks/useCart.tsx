import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  function onSetCart(products: Product[]) {
    try {
      setCart([...products]);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(products));
    } catch (err) {
      toast.error(err);
    }
  }

  async function checkInStock(productId: number) {
    const { data } = await api.get<Stock>(`stock/${productId}`);
    return data;
  }

  const addProduct = async (productId: number) => {
    try {
      const stock = await checkInStock(productId);
      const product = cart.find((product) => product.id === productId);

      if (!!product) {
        if (product.amount < stock.amount) {
          const incrementAmount = product.amount + 1;

          updateProductAmount({
            productId: product.id,
            amount: incrementAmount,
          });
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      } else {
        if (stock.amount > 0) {
          const response = await api.get(`products/${productId}`);
          const product = {
            ...response.data,
            amount: 1,
          };

          onSetCart([...cart, product]);
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find((product) => product.id === productId);
      if (!!product) {
        const data = cart.filter((product) => product.id !== productId);

        onSetCart([...data]);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await checkInStock(productId);
      const productFound = cart.find((product) => product.id === productId);

      if (productFound) {
        if ((amount > 0 && amount <= stock.amount) || amount < 0) {
          const updatedCart = cart.map((product) =>
            product.id === productId ? { ...product, amount } : product
          );
          onSetCart([...updatedCart]);
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

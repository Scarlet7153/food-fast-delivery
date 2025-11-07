import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      restaurantId: null,
      restaurant: null,

      // Actions
      addItem: (item, restaurant) => {
        const state = get()
        
        // If adding from different restaurant, clear cart
        if (state.restaurantId && state.restaurantId !== restaurant._id) {
          set({
            items: [],
            restaurantId: restaurant._id,
            restaurant
          })
          toast.success(`Đã chuyển sang ${restaurant.name}`)
        } else if (!state.restaurantId) {
          set({
            restaurantId: restaurant._id,
            restaurant
          })
        }

        const existingItem = state.items.find(
          cartItem => cartItem.menuItemId === item._id
        )

        if (existingItem) {
          // Update quantity
          const updatedItems = state.items.map(cartItem =>
            cartItem.menuItemId === item._id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
          set({ items: updatedItems })
          toast.success(`Đã thêm ${item.name} vào giỏ hàng`)
        } else {
          // Add new item
          const newItem = {
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: 1,
            imageUrl: item.imageUrl,
            // weightGrams removed from model; keep compatibility by omitting
            weightGrams: item.weightGrams || 0,
            specialInstructions: ''
          }
          set({ items: [...state.items, newItem] })
          toast.success(`Đã thêm ${item.name} vào giỏ hàng`)
        }
      },

      removeItem: (menuItemId) => {
        const state = get()
        const updatedItems = state.items.filter(
          item => item.menuItemId !== menuItemId
        )
        set({ items: updatedItems })
        toast.success('Đã xóa món khỏi giỏ')
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId)
          return
        }

        const state = get()
        const updatedItems = state.items.map(item =>
          item.menuItemId === menuItemId
            ? { ...item, quantity }
            : item
        )
        set({ items: updatedItems })
      },

      updateSpecialInstructions: (menuItemId, instructions) => {
        const state = get()
        const updatedItems = state.items.map(item =>
          item.menuItemId === menuItemId
            ? { ...item, specialInstructions: instructions }
            : item
        )
        set({ items: updatedItems })
      },

      clearCart: () => {
        set({ 
          items: [], 
          restaurantId: null, 
          restaurant: null 
        })
        toast.success('Đã xóa toàn bộ giỏ hàng')
      },

      // Computed values
      getTotalItems: () => {
        const { items } = get()
        return items.length
      },

      getTotalQuantity: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        const { items } = get()
        return items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      getTotalWeight: () => {
        const { items } = get()
        return items.reduce((total, item) => total + ((item.weightGrams || 0) * item.quantity), 0)
      },

      getDeliveryFee: () => {
        const { restaurant } = get()
        if (!restaurant || !restaurant.deliverySettings) {
          return 0
        }
        
        // This would be calculated based on distance in real implementation
        // For now, return base rate
        return restaurant.deliverySettings.baseRate || 10000
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const deliveryFee = get().getDeliveryFee()
        return subtotal + deliveryFee
      },

      isEmpty: () => {
        const { items } = get()
        return items.length === 0
      },

      hasRestaurant: () => {
        const { restaurantId } = get()
        return !!restaurantId
      },

      getItemQuantity: (menuItemId) => {
        const { items } = get()
        const item = items.find(item => item.menuItemId === menuItemId)
        return item ? item.quantity : 0
      },

      getItemSpecialInstructions: (menuItemId) => {
        const { items } = get()
        const item = items.find(item => item.menuItemId === menuItemId)
        return item ? item.specialInstructions : ''
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        restaurant: state.restaurant
      }),
    }
  )
)

export { useCartStore }

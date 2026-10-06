import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ShopProvider } from './store/ShopContext'
import CustomerLayout from './components/CustomerLayout'
import Home from './pages/Home'
import Details from './pages/Details'
import Budget from './pages/Budget'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Review from './pages/Review'
import Success from './pages/Success'
import { Spinner } from './components/ui'

const AdminApp = lazy(() => import('./admin/AdminApp'))

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/admin/*" element={<Suspense fallback={<Spinner />}><AdminApp /></Suspense>} />
        <Route element={<ShopProvider><CustomerLayout /></ShopProvider>}>
          <Route index element={<Home />} />
          <Route path="order/details" element={<Details />} />
          <Route path="order/budget" element={<Budget />} />
          <Route path="shop" element={<Navigate to="/shop/gift-boxes" replace />} />
          <Route path="shop/:tab" element={<Shop />} />
          <Route path="cart" element={<Cart />} />
          <Route path="order/review" element={<Review />} />
          <Route path="order/success" element={<Success />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}

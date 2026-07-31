
import { Routes, Route } from 'react-router-dom'
import MainLayout from './Layout/MainLayout'
import ProfilePage from './assets/Pages/ProfilePage'
import CTA from './assets/Pages/CTA'
import Howitworks from './assets/Pages/Howitworks'
import FeaturesHighlight from './assets/Pages/FeaturesHighlight'
import Discoverstyle from './assets/Pages/discoverstyle'
import AuthPage from './assets/Pages/AuthPage'
import AnalyzePage from './assets/Pages/AnalyzePage'
import Undertone from './assets/Pages/undertone'
import SkinTonePage from './assets/Pages/Skintone'
import Bodytype from './assets/Pages/Bodytype'
import AIchat from './assets/Pages/AIchat'
import FaceShapePage from './assets/Pages/FaceShapePage'
import Blogs from './assets/Pages/Blogs'
import ResultsPage from "./assets/Pages/ResultsPage";
import StyleDnaPage from './assets/Pages/StyleDnaPage'
import JewelryRecommendations from './assets/Pages/JewelryRecommendations'
import MakeupRecommendations from './assets/Pages/MakeupRecommendations'

const E = ({ children }) => <div data-theme="earthen">{children}</div>;

function App() {
  return (
    <Routes>
      {/* PAGES WITH NAVBAR + FOOTER */}
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={
            <>
              <CTA />
              <Howitworks />
              <FeaturesHighlight />
              <Discoverstyle />
            </>
          }
        />
        <Route path="/AnalyzePage" element={<E><AnalyzePage /></E>} />
        <Route path="/under-tone" element={<E><Undertone /></E>} />
        <Route path="/skin-tone" element={<E><SkinTonePage /></E>} />
        <Route path="/jewelry-recommendations" element={<E><JewelryRecommendations /></E>} />
        <Route path="/makeup-recommendations" element={<E><MakeupRecommendations /></E>} />
        <Route path="/body-type" element={<E><Bodytype /></E>} />
        <Route path="/face-shape" element={<E><FaceShapePage /></E>} />
        <Route path="/AIchat" element={<E><AIchat /></E>} />
        <Route path="/Blogs" element={<Blogs />} />
        <Route path="/style-dna" element={<E><StyleDnaPage /></E>} />
        <Route path="/results" element={<E><ResultsPage /></E>} />
      </Route>

      {/* PAGES WITHOUT NAVBAR + FOOTER */}
      <Route path="/auth" element={<E><AuthPage /></E>} />
      <Route path="/profile" element={<E><ProfilePage /></E>} />

      {/* 404 PAGE */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-lg mb-6">Page not found</p>
            <a href="/" className="btn btn-primary">Go Home</a>
          </div>
        }
      />
    </Routes>
  )
}

export default App

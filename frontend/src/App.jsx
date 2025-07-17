import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/protected-route"
import Unauthorized from "./pages/auth/Unauthorized"

// Auth Pages
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"

// Admin Pages
import AdminDashboard from "./pages/roleMangement/AdminDashboard"
import EditUserRoles from "./pages/roleMangement/EditUserRoles"
import CreateUser from "./pages/roleMangement/CreateUser"

// Home Page
import Home from "./pages/homepage/Home"

// User Pages
import ProfilePage from "./pages/user/profile-page"
import SettingsPage from "./pages/user/settings-page"

// Dashboard Pages - NEW
import FactoryDashboard from "./pages/gestionStock/machine_dashboard/dash"
import MachinesPage from "./pages/gestionStock/machine_dashboard/machines"
import MaterialsPage from "./pages/gestionStock/machine_dashboard/materials"
import AllocationsPage from "./pages/gestionStock/machine_dashboard/allocations"

// Inventory Management Pages
import ShowCategories from "./pages/gestionStock/categories/ShowCategories"
import CreateCategory from "./pages/gestionStock/categories/CreateCategory"
import EditCategory from "./pages/gestionStock/categories/EditCategory"
import ShowLocations from "./pages/gestionStock/location/ShowLocations"
import CreateLocation from "./pages/gestionStock/location/CreateLocation"
import EditLocation from "./pages/gestionStock/location/EditLocation"
import ShowMachines from "./pages/gestionStock/machine/ShowMachines"
import CreateMachine from "./pages/gestionStock/machine/CreateMachine"
import EditMachine from "./pages/gestionStock/machine/EditMachine"
import SupplierList from "./pages/gestionStock/suppliers/SupplierList"
import CreateSupplier from "./pages/gestionStock/suppliers/CreateSupplier"
import EditSupplier from "./pages/gestionStock/suppliers/EditSupplier"
import MaterialList from "./pages/gestionStock/materials/MaterialList"
import CreateMaterial from "./pages/gestionStock/materials/CreateMaterial"
import EditMaterial from "./pages/gestionStock/materials/EditMaterial"
import MaterialDetails from "./pages/gestionStock/materials/material-details"
import Materialmachinelist from "../src/pages/gestionStock/machineMaterials/material-machine-list"
import Materialmachinecreate from "../src/pages/gestionStock/machineMaterials/material-machine-create"
import Materialmachinedetails from "../src/pages/gestionStock/machineMaterials/material-machine-details"
import Materialmachineedit from "../src/pages/gestionStock/machineMaterials/material-machine-edit"
import CreateFactory from "./pages/factories/CreateFactory"
import EditFactory from "./pages/factories/EditFactory"
import ShowFactories from "./pages/factories/ShowFactories"
import FactoryDetails from "./pages/factories/FactoryDetails"

// Pedido (Order) Pages
import PedidoList from "./pages/pedido/PedidoList"
import Createpedido from "./pages/pedido/create-pedido"
import Editpedido from "./pages/pedido/edit-pedido"
import PedidoDetails from "./pages/pedido/PedidoDetails"
import ShowSolicitante from "./pages/pedido/solicitante/show-solicitante"
import EditSolicitante from "./pages/pedido/solicitante/edit-solicitante"
import CreateSolicitante from "./pages/pedido/solicitante/create-solicitante"
import ShowTableStatus from "./pages/pedido/status/show-table-status"
import EditTableStatus from "./pages/pedido/status/edit-table-status"
import CreateTableStatus from "./pages/pedido/status/create-table-status"
import ShowTipo from "./pages/pedido/tipo/show-tipo"
import EditTipo from "./pages/pedido/tipo/edit-tipo"
import CreateTipo from "./pages/pedido/tipo/create-tipo"

function App() {
  // Define role groups for different sections
  const adminRoles = ["Admin"]
  const productionRoles = [
    "Admin",
    "Manager",
    "PRODUCCION",
    "Manufacturing Eng. Manager",
    "Manufacturing Eng. Leader",
    "Project Manager",
    "Business Manager",
    "Financial Leader",
    "Methodes UAP1&3",
    "Methodes UAP2",
    "Maintenance Manager",
    "Maintenance Leader UAP2",
    "Prod. Plant Manager UAP1",
    "Prod. Plant Manager UAP2",
    "Quality Manager",
    "Quality Leader UAP1",
    "Quality Leader UAP2",
    "Quality Leader UAP3",
  ]
  const logisticRoles = ["Admin", "LOGISTICA", "PRODUCCION"]
  const inventoryRoles = ["Admin", "Manager"]
  const qualityRoles = ["Admin", "Manager"]

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Home route - redirects to login if not authenticated */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* User profile routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={adminRoles}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-user/:license"
          element={
            <ProtectedRoute requiredRoles={adminRoles}>
              <EditUserRoles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-user"
          element={
            <ProtectedRoute requiredRoles={adminRoles}>
              <CreateUser />
            </ProtectedRoute>
          }
        />

        {/* NEW: Factory Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <FactoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/machines"
          element={
            <ProtectedRoute>
              <MachinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/materials"
          element={
            <ProtectedRoute>
              <MaterialsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/allocations"
          element={
            <ProtectedRoute>
              <AllocationsPage />
            </ProtectedRoute>
          }
        />

        {/* Categories routes */}
        <Route
          path="categories"
          element={
            <ProtectedRoute>
              <ShowCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories/create"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <CreateCategory />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories/edit/:id"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <EditCategory />
            </ProtectedRoute>
          }
        />

        {/* Locations routes */}
        <Route
          path="locations"
          element={
            <ProtectedRoute>
              <ShowLocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="locations/create"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <CreateLocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="locations/edit/:id"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <EditLocation />
            </ProtectedRoute>
          }
        />

        {/* Machines routes */}
        <Route
          path="machines"
          element={
            <ProtectedRoute>
              <ShowMachines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machines/create"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <CreateMachine />
            </ProtectedRoute>
          }
        />
        <Route
          path="machines/edit/:id"
          element={
            <ProtectedRoute requiredRoles={productionRoles}>
              <EditMachine />
            </ProtectedRoute>
          }
        />
        <Route
          path="machines/details/:id"
          element={
            <ProtectedRoute>
              <EditMachine /> 
            </ProtectedRoute>
          }
        />

        {/* Suppliers routes */}
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <SupplierList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers/create"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <CreateSupplier />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers/edit/:id"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <EditSupplier />
            </ProtectedRoute>
          }
        />

        {/* Materials routes */}
        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <MaterialList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials/create"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <CreateMaterial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials/edit/:id"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <EditMaterial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials/details/:id"
          element={
            <ProtectedRoute>
              <MaterialDetails />
            </ProtectedRoute>
          }
        />

        {/* Machine Material routes */}
        <Route
          path="/machinematerial"
          element={
            <ProtectedRoute>
              <Materialmachinelist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machinematerial/create"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <Materialmachinecreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machinematerial/detail/:id"
          element={
            <ProtectedRoute>
              <Materialmachinedetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machinematerial/edit/:id"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <Materialmachineedit />
            </ProtectedRoute>
          }
        />

        {/* Pedido (Order) routes */}
        <Route
          path="/pedido"
          element={
            <ProtectedRoute>
              <PedidoList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedido/create"
          element={
            <ProtectedRoute requiredRoles={logisticRoles}>
              <Createpedido />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedido/edit/:id"
          element={
            <ProtectedRoute requiredRoles={logisticRoles}>
              <Editpedido />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedido/:id"
          element={
            <ProtectedRoute>
              <PedidoDetails />
            </ProtectedRoute>
          }
        />

        {/* Solicitante routes */}
        <Route
          path="/solicitante"
          element={
            <ProtectedRoute>
              <ShowSolicitante />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitante/edit/:id"
          element={
            <ProtectedRoute requiredRoles={logisticRoles}>
              <EditSolicitante />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitante/create"
          element={
            <ProtectedRoute requiredRoles={logisticRoles}>
              <CreateSolicitante />
            </ProtectedRoute>
          }
        />

        {/* Table Status routes */}
        <Route
          path="/table-status"
          element={
            <ProtectedRoute>
              <ShowTableStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/table-status/edit/:id"
          element={
            <ProtectedRoute requiredRoles={logisticRoles}>
              <EditTableStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/table-status/create"
          element={
            <ProtectedRoute requiredRoles={logisticRoles}>
              <CreateTableStatus />
            </ProtectedRoute>
          }
        />

        {/* Tipo routes */}
        <Route
          path="/tipo"
          element={
            <ProtectedRoute>
              <ShowTipo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipo/edit/:id"
          element={
            <ProtectedRoute requiredRoles={logisticRoles}>
              <EditTipo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipo/create"
          element={
            <ProtectedRoute requiredRoles={logisticRoles}>
              <CreateTipo />
            </ProtectedRoute>
          }
        />

        {/* Factory routes */}
        <Route
          path="/factories"
          element={
            <ProtectedRoute>
              <ShowFactories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/factories/create"
          element={
            <ProtectedRoute requiredRoles={inventoryRoles}>
              <CreateFactory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/factories/edit/:id"
          element={
            <ProtectedRoute>
              <EditFactory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/factories/detail/:id" 
          element={
            <ProtectedRoute>
              <FactoryDetails />
            </ProtectedRoute>
          }
        />

       

        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
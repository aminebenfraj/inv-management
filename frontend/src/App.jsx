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
  // Simplified role groups
  const adminRoles = ["Admin"]
  const adminManagerRoles = ["Admin", "Manager"] // Manager can access everything except user management
  const allRoles = ["Admin", "Manager", "User"] // All users can access basic functionality
  const factoryOnlyRoles = ["Admin", "Manager", "User"] // All users can access factories

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Home route - accessible to all authenticated users */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* User profile routes - accessible to all authenticated users */}
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

        {/* Admin routes - ONLY Admin can access user management */}
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

        {/* Factory Dashboard Routes - Admin and Manager can access */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRoles={factoryOnlyRoles}>
              <FactoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/machines"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <MachinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/materials"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <MaterialsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/allocations"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <AllocationsPage />
            </ProtectedRoute>
          }
        />

        {/* Factory routes - All users can access factories */}
        <Route
          path="/factories"
          element={
            <ProtectedRoute requiredRoles={factoryOnlyRoles}>
              <ShowFactories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/factories/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <CreateFactory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/factories/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditFactory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/factories/detail/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <FactoryDetails />
            </ProtectedRoute>
          }
        />

        {/* Categories routes - Admin and Manager only */}
        <Route
          path="categories"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <ShowCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <CreateCategory />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditCategory />
            </ProtectedRoute>
          }
        />

        {/* Locations routes - Admin and Manager only */}
        <Route
          path="locations"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <ShowLocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="locations/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <CreateLocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="locations/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditLocation />
            </ProtectedRoute>
          }
        />

        {/* Machines routes - Admin and Manager only */}
        <Route
          path="machines"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <ShowMachines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machines/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <CreateMachine />
            </ProtectedRoute>
          }
        />
        <Route
          path="machines/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditMachine />
            </ProtectedRoute>
          }
        />
        <Route
          path="machines/details/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditMachine />
            </ProtectedRoute>
          }
        />

        {/* Suppliers routes - Admin and Manager only */}
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <SupplierList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <CreateSupplier />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditSupplier />
            </ProtectedRoute>
          }
        />

        {/* Materials routes - Admin and Manager only */}
        <Route
          path="/materials"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <MaterialList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <CreateMaterial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditMaterial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials/details/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <MaterialDetails />
            </ProtectedRoute>
          }
        />

        {/* Machine Material routes - Admin and Manager only */}
        <Route
          path="/machinematerial"
          element={
            <ProtectedRoute requiredRoles={factoryOnlyRoles}>
              <Materialmachinelist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machinematerial/create"
          element={
            <ProtectedRoute requiredRoles={factoryOnlyRoles}>
              <Materialmachinecreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machinematerial/detail/:id"
          element={
            <ProtectedRoute requiredRoles={factoryOnlyRoles}>
              <Materialmachinedetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machinematerial/edit/:id"
          element={
            <ProtectedRoute requiredRoles={allRoles}>
              <Materialmachineedit />
            </ProtectedRoute>
          }
        />

        {/* Pedido (Order) routes - Admin and Manager only */}
        <Route
          path="/pedido"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <PedidoList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedido/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <Createpedido />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedido/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <Editpedido />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedido/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <PedidoDetails />
            </ProtectedRoute>
          }
        />

        {/* Solicitante routes - Admin and Manager only */}
        <Route
          path="/solicitante"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <ShowSolicitante />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitante/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditSolicitante />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitante/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <CreateSolicitante />
            </ProtectedRoute>
          }
        />

        {/* Table Status routes - Admin and Manager only */}
        <Route
          path="/table-status"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <ShowTableStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/table-status/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditTableStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/table-status/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <CreateTableStatus />
            </ProtectedRoute>
          }
        />

        {/* Tipo routes - Admin and Manager only */}
        <Route
          path="/tipo"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <ShowTipo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipo/edit/:id"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <EditTipo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipo/create"
          element={
            <ProtectedRoute requiredRoles={adminManagerRoles}>
              <CreateTipo />
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

import Jobs from './pages/Jobs';
import CreateInvoice from './pages/CreateInvoice';
import BudgetTracker from './pages/BudgetTracker';
import Reports from './pages/Reports';
import Team from './pages/Team';
import Clients from './pages/Clients';
import Suppliers from './pages/Suppliers';
import InvoicePrintView from './pages/InvoicePrintView';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Reminders from './pages/Reminders';
import QuotationForm from './pages/QuotationForm';
import Requests from './pages/Requests';
import Contacts from './pages/Contacts';
import CreateQuotation from './pages/CreateQuotation';
import ClientQuote from './pages/ClientQuote';
import ItemsAndServices from './pages/ItemsAndServices';
import ShopCash from './pages/ShopCash';
import Dump from './pages/Dump';
import PrinterMaintenance from './pages/PrinterMaintenance';
import IDPrinting from './pages/IDPrinting';
import Creatives from './pages/Creatives';
import PublicContentView from './pages/PublicContentView';
import Forms from './pages/Forms';
import ReimbursementPrintView from './pages/ReimbursementPrintView';
import ARView from './pages/ARView';
import Dashboard from './pages/Dashboard';
import QuotationPrintView from './pages/QuotationPrintView';
import ClientOrderForm from './pages/ClientOrderForm';
import PurchaseOrderPrintView from './pages/PurchaseOrderPrintView';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import HomepageSettings from './pages/HomepageSettings';
import OrderTracking from './pages/OrderTracking';
import ARStickerManager from './pages/ARStickerManager';
import ARViewer from './pages/ARViewer';
import Summary from './pages/Summary';
import ActivityLog from './pages/ActivityLog';
import QRGenerator from './pages/QRGenerator';
import UnauthorizedAccess from './pages/UnauthorizedAccess';
import DynamicForm from './pages/DynamicForm';
import DeliveryFormPrint from './pages/DeliveryFormPrint';
import CreateDeliveryForm from './pages/CreateDeliveryForm';
import AdvancedReports from './pages/AdvancedReports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Jobs": Jobs,
    "CreateInvoice": CreateInvoice,
    "BudgetTracker": BudgetTracker,
    "Reports": Reports,
    "Team": Team,
    "Clients": Clients,
    "Suppliers": Suppliers,
    "InvoicePrintView": InvoicePrintView,
    "Settings": Settings,
    "Inventory": Inventory,
    "Reminders": Reminders,
    "QuotationForm": QuotationForm,
    "Requests": Requests,
    "Contacts": Contacts,
    "CreateQuotation": CreateQuotation,
    "ClientQuote": ClientQuote,
    "ItemsAndServices": ItemsAndServices,
    "ShopCash": ShopCash,
    "Dump": Dump,
    "PrinterMaintenance": PrinterMaintenance,
    "IDPrinting": IDPrinting,
    "Creatives": Creatives,
    "PublicContentView": PublicContentView,
    "Forms": Forms,
    "ReimbursementPrintView": ReimbursementPrintView,
    "ARView": ARView,
    "Dashboard": Dashboard,
    "QuotationPrintView": QuotationPrintView,
    "ClientOrderForm": ClientOrderForm,
    "PurchaseOrderPrintView": PurchaseOrderPrintView,
    "Home": Home,
    "NotFound": NotFound,
    "HomepageSettings": HomepageSettings,
    "OrderTracking": OrderTracking,
    "ARStickerManager": ARStickerManager,
    "ARViewer": ARViewer,
    "Summary": Summary,
    "ActivityLog": ActivityLog,
    "QRGenerator": QRGenerator,
    "UnauthorizedAccess": UnauthorizedAccess,
    "DynamicForm": DynamicForm,
    "DeliveryFormPrint": DeliveryFormPrint,
    "CreateDeliveryForm": CreateDeliveryForm,
    "AdvancedReports": AdvancedReports,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
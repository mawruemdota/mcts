import ARStickerManager from './pages/ARStickerManager';
import ARView from './pages/ARView';
import ARViewer from './pages/ARViewer';
import ActivityLog from './pages/ActivityLog';
import AdvancedReports from './pages/AdvancedReports';
import BudgetTracker from './pages/BudgetTracker';
import ClientOrderForm from './pages/ClientOrderForm';
import ClientQuote from './pages/ClientQuote';
import Clients from './pages/Clients';
import Contacts from './pages/Contacts';
import CreateDeliveryForm from './pages/CreateDeliveryForm';
import CreateInvoice from './pages/CreateInvoice';
import CreateQuotation from './pages/CreateQuotation';
import Creatives from './pages/Creatives';
import Dashboard from './pages/Dashboard';
import DeliveryFormPrint from './pages/DeliveryFormPrint';
import Dump from './pages/Dump';
import DynamicForm from './pages/DynamicForm';
import Forms from './pages/Forms';
import Home from './pages/Home';
import HomepageSettings from './pages/HomepageSettings';
import IDPrinting from './pages/IDPrinting';
import Inventory from './pages/Inventory';
import InvoicePrintView from './pages/InvoicePrintView';
import ItemsAndServices from './pages/ItemsAndServices';
import Jobs from './pages/Jobs';
import MCTSToolbox from './pages/MCTSToolbox';
import NotFound from './pages/NotFound';
import OrderTracking from './pages/OrderTracking';
import PrinterMaintenance from './pages/PrinterMaintenance';
import PublicContentView from './pages/PublicContentView';
import PurchaseOrderPrintView from './pages/PurchaseOrderPrintView';
import QRGenerator from './pages/QRGenerator';
import QuotationForm from './pages/QuotationForm';
import QuotationPrintView from './pages/QuotationPrintView';
import ReimbursementPrintView from './pages/ReimbursementPrintView';
import Reminders from './pages/Reminders';
import Reports from './pages/Reports';
import Requests from './pages/Requests';
import Settings from './pages/Settings';
import ShopCash from './pages/ShopCash';
import Summary from './pages/Summary';
import Suppliers from './pages/Suppliers';
import Team from './pages/Team';
import UnauthorizedAccess from './pages/UnauthorizedAccess';
import TaskTemplates from './pages/TaskTemplates';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ARStickerManager": ARStickerManager,
    "ARView": ARView,
    "ARViewer": ARViewer,
    "ActivityLog": ActivityLog,
    "AdvancedReports": AdvancedReports,
    "BudgetTracker": BudgetTracker,
    "ClientOrderForm": ClientOrderForm,
    "ClientQuote": ClientQuote,
    "Clients": Clients,
    "Contacts": Contacts,
    "CreateDeliveryForm": CreateDeliveryForm,
    "CreateInvoice": CreateInvoice,
    "CreateQuotation": CreateQuotation,
    "Creatives": Creatives,
    "Dashboard": Dashboard,
    "DeliveryFormPrint": DeliveryFormPrint,
    "Dump": Dump,
    "DynamicForm": DynamicForm,
    "Forms": Forms,
    "Home": Home,
    "HomepageSettings": HomepageSettings,
    "IDPrinting": IDPrinting,
    "Inventory": Inventory,
    "InvoicePrintView": InvoicePrintView,
    "ItemsAndServices": ItemsAndServices,
    "Jobs": Jobs,
    "MCTSToolbox": MCTSToolbox,
    "NotFound": NotFound,
    "OrderTracking": OrderTracking,
    "PrinterMaintenance": PrinterMaintenance,
    "PublicContentView": PublicContentView,
    "PurchaseOrderPrintView": PurchaseOrderPrintView,
    "QRGenerator": QRGenerator,
    "QuotationForm": QuotationForm,
    "QuotationPrintView": QuotationPrintView,
    "ReimbursementPrintView": ReimbursementPrintView,
    "Reminders": Reminders,
    "Reports": Reports,
    "Requests": Requests,
    "Settings": Settings,
    "ShopCash": ShopCash,
    "Summary": Summary,
    "Suppliers": Suppliers,
    "Team": Team,
    "UnauthorizedAccess": UnauthorizedAccess,
    "TaskTemplates": TaskTemplates,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
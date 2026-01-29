/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import SalesReport from './pages/SalesReport';
import Settings from './pages/Settings';
import ShopCash from './pages/ShopCash';
import Summary from './pages/Summary';
import Suppliers from './pages/Suppliers';
import TaskTemplates from './pages/TaskTemplates';
import Team from './pages/Team';
import UnauthorizedAccess from './pages/UnauthorizedAccess';
import ReportMaker from './pages/ReportMaker';
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
    "SalesReport": SalesReport,
    "Settings": Settings,
    "ShopCash": ShopCash,
    "Summary": Summary,
    "Suppliers": Suppliers,
    "TaskTemplates": TaskTemplates,
    "Team": Team,
    "UnauthorizedAccess": UnauthorizedAccess,
    "ReportMaker": ReportMaker,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
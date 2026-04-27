// ========== НАСТРОЙКА ==========
const CENTRAL_API_URL = "https://script.google.com/macros/s/AKfycby7FVaI7tqx2nxJpOueu9O4eF75-j2wDmegpGY_28y8rQJI5K4HeOq5Bj2qssUKS67T/exec";

let CURRENT_USER = {
    id: null,
    name: null,
    role: null,
    sheetUrl: null,
    shareStats: false,
    hideStats: false
};

let pendingOperations = [];
let isOnline = navigator.onLine;

// ========== ОСНОВНЫЕ ПЕРЕМЕННЫЕ ==========
let originalCardsData = [];     // теперь каждый объект имеет поле id
let currentFilteredData = [];
let isLoading = false;
let autoRefreshInterval = null;
let historySyncInterval = null;
let currentEditId = null;       // теперь храним id редактируемого товара
let selectedTypes = new Set();
let currentSortBy = "none";
let typeOptions = [];
let customOrder = [];           // теперь хранит id товаров
let dragStartIndex = null;
let selectedDiscountProducts = new Set(); // хранит id товаров
let discountProductListVisible = false;
let itemDiscounts = {};         // ключ - id товара
let discountPanelOpen = false;
let typeColors = new Map();
const colorPalette = ['#e67e22', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f1c40f', '#e67e22', '#95a5a6'];

let cart = {};                  // ключ - id товара
let extraCosts = [];
let globalExtraCosts = [];
let salesHistory = [];
let historyMethodFilter = "all";
let historyTypeFilter = "all";
let rulesList = [];
let currentRuleType = "type";
let selectedProducts = new Set(); // хранит id товаров (для правил)
let scrollPosition = 0;

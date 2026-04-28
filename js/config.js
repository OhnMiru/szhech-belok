// ========== НАСТРОЙКА ==========
const CENTRAL_API_URL = "https://script.google.com/macros/s/AKfycbw_5CMhPtBU9Qsh1g8sPp3RdVtpDNoFG8nguwJOLJecD0fNOCrc2el6_6k2_yqWf__e/exec";

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
let originalCardsData = [];
let currentFilteredData = [];
let isLoading = false;
let autoRefreshInterval = null;
let historySyncInterval = null;
let currentEditId = null;
let selectedTypes = new Set();
let currentSortBy = "none";
let typeOptions = [];
let customOrder = [];
let dragStartIndex = null;
let selectedDiscountProducts = new Set();
let discountProductListVisible = false;
let itemDiscounts = {};
let discountPanelOpen = false;
let typeColors = new Map();
const colorPalette = ['#e67e22', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f1c40f', '#e67e22', '#95a5a6'];

let cart = {};
let extraCosts = [];
let salesHistory = [];
let historyMethodFilter = "all";
let historyTypeFilter = "all";

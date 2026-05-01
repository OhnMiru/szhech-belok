// ========== НАСТРОЙКА ==========
var CENTRAL_API_URL = "https://szhech-belochek.pages.dev/api";

var CURRENT_USER = {
    id: null,
    name: null,
    role: null,
    sheetUrl: null,
    shareStats: false,
    hideStats: false
};

// ========== ПЕРЕМЕННЫЕ ДЛЯ ИМПЕРСОНАЦИИ (ВХОД ОТ ЛИЦА ОРГАНИЗАТОРА) ==========
var isImpersonating = false;           // Флаг: находится ли организатор в режиме подмены
var originalUserId = null;             // Оригинальный ID организатора (кого подменяют)
var originalUserName = null;           // Оригинальное имя организатора
var impersonatedUserId = null;         // ID пользователя, от лица которого действуют
var impersonatedUserName = null;       // Имя пользователя, от лица которого действуют
var impersonatedUserRole = null;       // Роль пользователя, от лица которого действуют

var pendingOperations = [];
var isOnline = navigator.onLine;

// ========== ОСНОВНЫЕ ПЕРЕМЕННЫЕ ==========
var originalCardsData = [];
var currentFilteredData = [];
var isLoading = false;
var autoRefreshInterval = null;
var historySyncInterval = null;
var currentEditId = null;
var selectedTypes = new Set();
var currentSortBy = "none";
var typeOptions = [];
var customOrder = [];
var dragStartIndex = null;
var selectedDiscountProducts = new Set();
var discountProductListVisible = false;
var itemDiscounts = {};
var discountPanelOpen = false;
var typeColors = new Map();
var colorPalette = ['#e67e22', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f1c40f', '#e67e22', '#95a5a6'];

var cart = {};
var extraCosts = [];
var salesHistory = [];
var historyMethodFilter = "all";
var historyTypeFilter = "all";
var historyPaymentFilter = "all";
var bookingsList = [];
var selectedBookingNickname = null;
var selectedBookingItems = [];
var bookings = [];
var currentBookingProducts = new Map();
var currentViewingBookingId = null;
var cartBookingMap = {};
var currentPaymentType = 'cash';

// ========== ПЕРЕМЕННЫЕ ДЛЯ ФОТО ==========
var photoCache = new Map();
var currentPhotoItemId = null;
var currentPhotoItemName = null;
var commentsCache = new Map();

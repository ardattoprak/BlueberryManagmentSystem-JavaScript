// Class definitions
class Farmer {// Farmer class stores farmer information.unique id for farmer / name, phone, email, city
    static _idCounter = 0;

    constructor(name, phone, email, city, id = null) {
        this.id = id !== null ? id : Farmer._idCounter++;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.city = city;
    }

    static resetIdCounter() {
        Farmer._idCounter = 0;
    }
}

class Purchase {// Records product purchases from farmers
    static _idCounter = 0;

    constructor(farmerId, productType, quantity, pricePerKg, purchaseDate = null, id = null) {
        this.id = id !== null ? id : Purchase._idCounter++;
        this.farmerId = farmerId;
        this.productType = productType;
        this.quantity = quantity * 1000; // because it needs to be converted to grams.
        this.pricePerKg = pricePerKg;
        this.pricePerGram = pricePerKg / 1000;
        this.date = purchaseDate ? new Date(purchaseDate) : new Date();
        this.totalCost = this.quantity * this.pricePerGram;
    }

    static resetIdCounter() {
        Purchase._idCounter = 0;
    }
}

class Order {
    static _idCounter = 0;

    constructor(customerName, contact, shippingInfo, category, quantity, orderDate = null, id = null) {
        this.id = id !== null ? id : Order._idCounter++;
        this.customerName = customerName;
        this.contact = contact;
        this.shippingInfo = shippingInfo;
        this.category = category;
        this.quantity = quantity;
        this.date = orderDate ? new Date(orderDate) : new Date();
        this.status = "Pending";
    }

    static resetIdCounter() {
        Order._idCounter = 0;
    }
}

class Inventory {// Inventory class manages warehouse inventory
    constructor() {
        this.unprocessedByType = {
            'fresh': 0,
            'frozen': 0,
            'organic': 0
        };
        this.processed = {
            'small': 0,
            'medium': 0,
            'large': 0,
            'extra-large': 0,
            'family-pack': 0,
            'bulk-pack': 0,
            'premium': 0
        };
        this.packageSizes = {
            'small': 100,
            'medium': 250,
            'large': 500,
            'extra-large': 1000,
            'family-pack': 2000,
            'bulk-pack': 5000,
            'premium': null 
        };
        this.minimumStock = {
            'small': 50,
            'medium': 30,
            'large': 20,
            'extra-large': 15,
            'family-pack': 10,
            'bulk-pack': 5,
            'premium': 10
        };
    }

    addUnprocessed(type, quantity) {
        if (this.unprocessedByType.hasOwnProperty(type)) {
            this.unprocessedByType[type] += quantity;
            return true;
        }
        return false;
    }
    processToCategory(sourceType, category, quantity, customSize = null) {
        if (!this.unprocessedByType.hasOwnProperty(sourceType)) {
            throw new Error(`Invalid source type: ${sourceType}`);
        }
    
        if (!this.packageSizes.hasOwnProperty(category)) {
            throw new Error(`Invalid category: ${category}`);
        }
    
        if (category === 'premium' && customSize) {
            this.packageSizes[category] = customSize;
        }
    
        const gramsPerPackage = this.packageSizes[category];
        if (!gramsPerPackage) {
            throw new Error('Package size not set');
        }
    
        const totalGramsNeeded = gramsPerPackage * quantity;
    
        if (this.unprocessedByType[sourceType] >= totalGramsNeeded) {
            this.unprocessedByType[sourceType] -= totalGramsNeeded;
            this.processed[category] += quantity;
            return true;
        }
    
        throw new Error(`Insufficient ${sourceType} inventory. Available: ${this.unprocessedByType[sourceType]}g, Required: ${totalGramsNeeded}g`);
    }
    getUnprocessedGrams(type) {
        return this.unprocessedByType[type] || 0;
    }

    getAvailableTypes() {
        return Object.entries(this.unprocessedByType)
            .filter(([_, amount]) => amount > 0)
            .map(([type]) => type);
    }
}

// validations functions for check all inputs
const validations = {
    phone: (value) => {
        const phoneRegex = /^[0-9]{11}$/;
        if (!phoneRegex.test(value)) {
            throw new Error('Phone number must be exactly 11 digits');
        }
        return true;
    },
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error('Invalid email format');
        }
        return true;
    },
    name: (value) => {
        if (value.length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }
        if (/\d/.test(value)) {
            throw new Error('Name should not contain numbers');
        }
        return true;
    },
    city: (value) => {
        if (value.length < 2) {
            throw new Error('City must be at least 2 characters long');
        }
        if (/\d/.test(value)) {
            throw new Error('City should not contain numbers');
        }
        return true;
    },
    customerName: (value) => {
        if (value.length < 2) {
            throw new Error('Customer name must be at least 2 characters long');
        }
        if (/\d/.test(value)) {
            throw new Error('Customer name should not contain numbers');
        }
        return true;
    },
    customerContact: (value) => {
        const phoneRegex = /^[0-9]{11}$/;
        if (!phoneRegex.test(value)) {
            throw new Error('Contact number must be exactly 11 digits');
        }
        return true;
    },
    shippingInfo: (value) => {
        if (value.length < 10) {
            throw new Error('Shipping info must be at least 10 characters long');
        }
        return true;
    },
    orderQuantity: (value) => {
        if (!Number.isInteger(value)) {
            throw new Error('Quantity must be a whole number');
        }
        if (value <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        return true;
    }
};

// Manages farmers, purchases, inventory, orders, and financial transactions.
class WarehouseManager {
    constructor() {
        // Initializing basic data structures
        this.farmers = {};
        this.purchases = [];
        this.inventory = new Inventory();
        this.orders = [];
        this.productPrices = {
            'small': 5.00,
            'medium': 10.00,
            'large': 18.00,
            'extra-large': 30.00,
            'family-pack': 50.00,
            'bulk-pack': 100.00,
            'premium': 75.00
        };
        this.financials = {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            taxLiability: 0,
            taxRate: 0.20,
            monthlyStats: {},
            yearlyStats: {}
        };

        // Load data from local storage
        this.loadFromLocalStorage();
    }

    // Local storage operations
    saveToLocalStorage() {
        const data = {
            farmers: this.farmers,
            purchases: this.purchases,
            inventory: this.inventory,
            orders: this.orders,
            productPrices: this.productPrices,
            financials: this.financials
        };
        localStorage.setItem('warehouseData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('warehouseData');
        if (savedData) {
            const data = JSON.parse(savedData);

            // Update farmer id counter
            Farmer.resetIdCounter();
            const maxFarmerId = Math.max(...Object.keys(data.farmers).map(Number), -1);
            Farmer._idCounter = maxFarmerId + 1;

            // Update purchase id counter
            Purchase.resetIdCounter();
            const maxPurchaseId = Math.max(...data.purchases.map(p => p.id), -1);
            Purchase._idCounter = maxPurchaseId + 1;

            // Update order id counter
            Order.resetIdCounter();
            const maxOrderId = Math.max(...data.orders.map(o => o.id), -1);
            Order._idCounter = maxOrderId + 1;

            // Farmers
            this.farmers = {};
            Object.entries(data.farmers).forEach(([id, farmer]) => {
                this.farmers[id] = new Farmer(
                    farmer.name,
                    farmer.phone,
                    farmer.email,
                    farmer.city,
                    parseInt(id)
                );
            });

            // Purchases
            this.purchases = data.purchases.map(p => new Purchase(
                p.farmerId,
                p.productType,
                p.quantity / 1000,
                p.pricePerKg,
                new Date(p.date),
                p.id
            ));

            // Inventory
            this.inventory = new Inventory();
            this.inventory.unprocessedByType = data.inventory.unprocessedByType;
            this.inventory.processed = { ...data.inventory.processed };

            // Orders
            this.orders = data.orders.map(o => {
                const order = new Order(
                    o.customerName,
                    o.contact,
                    o.shippingInfo,
                    o.category,
                    o.quantity,
                    new Date(o.date),
                    o.id
                );
                order.totalPrice = o.totalPrice;
                order.tax = o.tax;
                order.status = o.status;
                return order;
            });

            // Product prices ve financials
            this.productPrices = { ...data.productPrices };
            this.financials = { ...data.financials };
        }
        this.updateUI();
    }

    // Farmer transactions
    addFarmer(name, phone, email, city) {
        const farmer = new Farmer(name, phone, email, city);
        this.farmers[farmer.id] = farmer;
        this.saveToLocalStorage();
        this.updateUI();
        return farmer.id;
    }

    updateFarmer(farmerId, updates) {
        if (this.farmers[farmerId]) {
            const currentFarmer = this.farmers[farmerId];
            this.farmers[farmerId] = new Farmer(
                updates.name || currentFarmer.name,
                updates.phone || currentFarmer.phone,
                updates.email || currentFarmer.email,
                updates.city || currentFarmer.city,
                farmerId
            );
            this.saveToLocalStorage();
            this.updateUI();
            return true;
        }
        return false;
    }

    deleteFarmer(farmerId) {
        if (this.farmers[farmerId]) {
            delete this.farmers[farmerId];
            this.saveToLocalStorage();
            this.updateUI();
            return true;
        }
        return false;
    }

    // Purchase transactions
    recordPurchase(farmerId, productType, quantity, pricePerKg, purchaseDate = null) {
        if (this.farmers[farmerId]) {
            const purchase = new Purchase(farmerId, productType, quantity, pricePerKg, purchaseDate);
            this.purchases.push(purchase);
            this.inventory.addUnprocessed(productType, purchase.quantity);
            this.updateFinancials();
            this.saveToLocalStorage();
            this.updateUI();
            return purchase.id;
        }
        return null;
    }
    updatePurchase(purchaseId, updates) {
        const purchaseIndex = this.purchases.findIndex(p => p.id === purchaseId);
        if (purchaseIndex === -1) {
            throw new Error('Purchase not found');
        }
    
        const currentPurchase = this.purchases[purchaseIndex];
        
        // Remove old quantity from inventory
        this.inventory.unprocessedByType[currentPurchase.productType] -= currentPurchase.quantity;
    
        // Create new purchase with updates
        const updatedPurchase = new Purchase(
            updates.farmerId || currentPurchase.farmerId,
            updates.productType || currentPurchase.productType,
            (updates.quantity || currentPurchase.quantity / 1000), // Convert back to kg for constructor
            updates.pricePerKg || currentPurchase.pricePerKg,
            updates.purchaseDate || currentPurchase.date,
            purchaseId
        );
    
        // Add new quantity to inventory
        this.inventory.unprocessedByType[updatedPurchase.productType] += updatedPurchase.quantity;
    
        // Update purchase in array
        this.purchases[purchaseIndex] = updatedPurchase;
    
        this.updateFinancials();
        this.saveToLocalStorage();
        this.updateUI();
        return true;
    }
    
    deletePurchase(purchaseId) {
        const purchaseIndex = this.purchases.findIndex(p => p.id === purchaseId);
        if (purchaseIndex === -1) {
            return false;
        }
    
        const purchase = this.purchases[purchaseIndex];
        
        // Remove quantity from inventory
        this.inventory.unprocessedByType[purchase.productType] -= purchase.quantity;
        
        // Remove purchase from array
        this.purchases.splice(purchaseIndex, 1);
    
        this.updateFinancials();
        this.saveToLocalStorage();
        this.updateUI();
        return true;
    }

    // Order transactions
    createOrder(customerName, contact, shippingInfo, category, quantity, orderDate = null) {
        if (!(category in this.inventory.processed)) {
            throw new Error(`Invalid category: ${category}`);
        }

        if (this.inventory.processed[category] < quantity) {
            throw new Error(`Insufficient inventory for ${category}. Available: ${this.inventory.processed[category]}`);
        }

        const order = new Order(customerName, contact, shippingInfo, category, quantity, orderDate);
        order.totalPrice = quantity * this.productPrices[category];
        order.tax = order.totalPrice * this.financials.taxRate;

        this.inventory.processed[category] -= quantity;
        this.orders.push(order);

        this.updateFinancials();
        this.saveToLocalStorage();
        this.updateUI();

        return order.id;
    }

    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            this.saveToLocalStorage();
            this.updateUI();
            return true;
        }
        return false;
    }

    deleteOrder(orderId) {
        const orderIndex = this.orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            const order = this.orders[orderIndex];
            if (order.status !== 'Delivered') {
                this.inventory.processed[order.category] += order.quantity;
            }
            this.orders.splice(orderIndex, 1);
            this.updateFinancials();
            this.saveToLocalStorage();
            this.updateUI();
            return true;
        }
        return false;
    }

    updateProductPrice(category, newPrice) {
        if (newPrice <= 0) {
            throw new Error('Price must be greater than 0');
        }

        if (this.productPrices.hasOwnProperty(category)) {
            this.productPrices[category] = parseFloat(newPrice);
            this.saveToLocalStorage();
            this.updateUI();
            return true;
        }
        return false;
    }
    updatePriceTable() {
        const priceTable = document.querySelector('#price-table tbody');
        if (priceTable) {
            priceTable.innerHTML = '';
            Object.entries(this.productPrices).forEach(([category, price]) => {
                const packageSize = this.inventory.packageSizes[category];
                const pricePerKg = (price / packageSize) * 1000;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${category}</td>
                    <td>$${price.toFixed(2)}</td>
                    <td>${packageSize}g</td>
                    <td>$${pricePerKg.toFixed(2)}/kg</td>
                    <td>
                        <button onclick="editPrice('${category}', ${price}, ${packageSize})" class="edit-btn">
                            Edit Price
                        </button>
                    </td>
                `;
                priceTable.appendChild(row);
            });
        }
    }

    // Inventory transactions
    processInventory(sourceType, category, quantity, customSize = null) {
        try {
            const success = this.inventory.processToCategory(sourceType, category, quantity, customSize);
            if (success) {
                this.saveToLocalStorage();
                this.updateUI();
            }
            return success;
        } catch (error) {
            showMessage(error.message, 'error');
            return false;
        }
    }

    // Financial transactions
    updateFinancials() {
        this.financials.totalRevenue = this.orders.reduce((sum, order) => sum + order.totalPrice, 0);
        this.financials.totalExpenses = this.purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
        this.financials.taxLiability = this.orders.reduce((sum, order) => sum + order.tax, 0);
        this.financials.netProfit =
            this.financials.totalRevenue -
            this.financials.totalExpenses -
            this.financials.taxLiability;

        this.updatePeriodicStats();
        this.saveToLocalStorage();
    }

    updateOrder(orderId, updates) {
        const orderIndex = this.orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
            throw new Error('Order not found');
        }
    
        const currentOrder = this.orders[orderIndex];
        
        // Return inventory if quantity is changed
        if (updates.quantity !== currentOrder.quantity) {
            // Add back the old quantity to inventory
            this.inventory.processed[currentOrder.category] += currentOrder.quantity;
            
            // Check if new quantity is available
            if (this.inventory.processed[updates.category] < updates.quantity) {
                // Restore the original state
                this.inventory.processed[currentOrder.category] -= currentOrder.quantity;
                throw new Error(`Insufficient inventory for ${updates.category}. Available: ${this.inventory.processed[updates.category]}`);
            }
            
            // Remove new quantity from inventory
            this.inventory.processed[updates.category] -= updates.quantity;
        } else if (updates.category !== currentOrder.category) {
            // If only category changed
            this.inventory.processed[currentOrder.category] += currentOrder.quantity;
            
            if (this.inventory.processed[updates.category] < currentOrder.quantity) {
                // Restore the original state
                this.inventory.processed[currentOrder.category] -= currentOrder.quantity;
                throw new Error(`Insufficient inventory for ${updates.category}. Available: ${this.inventory.processed[updates.category]}`);
            }
            
            this.inventory.processed[updates.category] -= currentOrder.quantity;
        }
    
        // Update order details
        this.orders[orderIndex] = {
            ...currentOrder,
            customerName: updates.customerName || currentOrder.customerName,
            contact: updates.contact || currentOrder.contact,
            shippingInfo: updates.shippingInfo || currentOrder.shippingInfo,
            category: updates.category || currentOrder.category,
            quantity: updates.quantity || currentOrder.quantity,
            date: updates.orderDate ? new Date(updates.orderDate) : currentOrder.date
        };
    
        // Update total price
        this.orders[orderIndex].totalPrice = this.orders[orderIndex].quantity * this.productPrices[this.orders[orderIndex].category];
        this.orders[orderIndex].tax = this.orders[orderIndex].totalPrice * this.financials.taxRate;
    
        this.updateFinancials();
        this.saveToLocalStorage();
        this.updateUI();
        return true;
    }

    updateFilteredOrdersTable() {
        const orderTable = document.querySelector('#filtered-orders-table tbody');
        if (!orderTable) return;

        // Get filter values
        const statusFilter = document.getElementById('filter-status')?.value || '';
        const customerFilter = document.getElementById('filter-customer')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('filter-category')?.value || '';

        // Get filtered orders
        const filteredOrders = this.orders.filter(order => {
            const statusMatch = !statusFilter || order.status === statusFilter;
            const customerMatch = !customerFilter ||
                order.customerName.toLowerCase().includes(customerFilter);
            const categoryMatch = !categoryFilter || order.category === categoryFilter;

            return statusMatch && customerMatch && categoryMatch;
        });

        // Update table
        orderTable.innerHTML = '';
        filteredOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.contact}</td>
                <td>${order.category}</td>
                <td>${order.quantity}</td>
                <td>$${order.totalPrice?.toFixed(2) || '0.00'}</td>
                <td>
                    <select onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Processed" ${order.status === 'Processed' ? 'selected' : ''}>Processed</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                </td>
                <td>
                    <button onclick="editOrder(${order.id})" class="edit-btn">Edit</button>
                    <button onclick="deleteOrder(${order.id})" class="delete-btn">Delete</button>
                </td>
            `;
            orderTable.appendChild(row);
        });
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('filter-category');
        if (!categoryFilter) return;

        // Clear categories
        categoryFilter.innerHTML = '<option value="">All Categories</option>';

        // Get unique categories
        const uniqueCategories = [...new Set(this.orders.map(order => order.category))];

        // Add categories
        uniqueCategories.forEach(category => {
            if (category) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categoryFilter.appendChild(option);
            }
        });
    }

    updatePeriodicStats() {
        // Reset stats
        this.financials.monthlyStats = {};
        this.financials.yearlyStats = {};

        // Current date info
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        // Initialize stats
        this.financials.monthlyStats[currentMonthKey] = {
            revenue: 0,
            expenses: 0,
            profit: 0
        };
        this.financials.yearlyStats[currentYear] = {
            revenue: 0,
            expenses: 0,
            profit: 0
        };

        // Process purchases and orders
        this.processPurchaseStats();
        this.processOrderStats();
        this.calculatePeriodProfits();
    }

    processPurchaseStats() {
        this.purchases.forEach(purchase => {
            const date = new Date(purchase.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const yearKey = date.getFullYear().toString();

            if (!this.financials.monthlyStats[monthKey]) {
                this.financials.monthlyStats[monthKey] = {
                    revenue: 0,
                    expenses: 0,
                    profit: 0
                };
            }

            if (!this.financials.yearlyStats[yearKey]) {
                this.financials.yearlyStats[yearKey] = {
                    revenue: 0,
                    expenses: 0,
                    profit: 0
                };
            }

            // Update monthly statistics
            this.financials.monthlyStats[monthKey].expenses += purchase.totalCost;

            // Update annual statistics
            this.financials.yearlyStats[yearKey].expenses += purchase.totalCost;
        });
    }
    processOrderStats() {
        this.orders.forEach(order => {
            const date = new Date(order.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const yearKey = date.getFullYear().toString();

            if (!this.financials.monthlyStats[monthKey]) {
                this.financials.monthlyStats[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
            }
            if (!this.financials.yearlyStats[yearKey]) {
                this.financials.yearlyStats[yearKey] = { revenue: 0, expenses: 0, profit: 0 };
            }

            this.financials.monthlyStats[monthKey].revenue += order.totalPrice;
            this.financials.yearlyStats[yearKey].revenue += order.totalPrice;
        });
    }

    calculatePeriodProfits() {
        Object.keys(this.financials.monthlyStats).forEach(monthKey => {
            const stats = this.financials.monthlyStats[monthKey];
            const grossProfit = stats.revenue - stats.expenses;
            stats.profit = grossProfit - (grossProfit > 0 ? grossProfit * this.financials.taxRate : 0);
        });

        Object.keys(this.financials.yearlyStats).forEach(yearKey => {
            const stats = this.financials.yearlyStats[yearKey];
            const grossProfit = stats.revenue - stats.expenses;
            stats.profit = grossProfit - (grossProfit > 0 ? grossProfit * this.financials.taxRate : 0);
        });
    }
    handlePurchaseSort(sortCriteria) {
        if (!this.purchases.length) {
            showMessage('No purchase records found', 'error');
            return;
        }

        // Get all filter values
        const filterType = document.getElementById('filter-product-type').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const farmerFilter = document.getElementById('farmer-summary-select').value;

        // Apply all filters using and logic
        let filteredPurchases = [...this.purchases];

        // Filter by product type
        if (filterType) {
            filteredPurchases = filteredPurchases.filter(p => p.productType === filterType);
        }

        // Filter by date range
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59); // Include entire end day

            filteredPurchases = filteredPurchases.filter(p => {
                const purchaseDate = new Date(p.date);
                return purchaseDate >= start && purchaseDate <= end;
            });
        }

        // Filter by farmer
        if (farmerFilter) {
            filteredPurchases = filteredPurchases.filter(p => String(p.farmerId) === String(farmerFilter));
        }

        // Apply sorting after filtering
        if (sortCriteria) {
            switch (sortCriteria) {
                case 'date':
                    filteredPurchases.sort((a, b) => new Date(b.date) - new Date(a.date));
                    break;
                case 'farmer':
                    filteredPurchases.sort((a, b) =>
                        this.farmers[a.farmerId].name.localeCompare(this.farmers[b.farmerId].name));
                    break;
                case 'type':
                    filteredPurchases.sort((a, b) => a.productType.localeCompare(b.productType));
                    break;
                case 'amount':
                    filteredPurchases.sort((a, b) => b.quantity - a.quantity);
                    break;
                case 'price':
                    filteredPurchases.sort((a, b) => b.pricePerKg - a.pricePerKg);
                    break;
                case 'total':
                    filteredPurchases.sort((a, b) => b.totalCost - a.totalCost);
                    break;
            }
        }

        // Display filtered and sorted results
        this.displayPurchaseSummary(filteredPurchases);
    }
    displayPurchaseSummary(purchases) {
        const summaryDiv = document.getElementById('summary-results');
        if (!summaryDiv) return;

        const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0) / 1000;
        const totalCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);

        // Get active filters for display
        const activeFilters = [];
        const productType = document.getElementById('filter-product-type').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const farmerFilter = document.getElementById('farmer-summary-select').value;

        if (productType) activeFilters.push(`Type: ${productType}`);
        if (startDate && endDate) activeFilters.push(`Date Range: ${startDate} to ${endDate}`);
        if (farmerFilter) {
            const farmerName = this.farmers[farmerFilter]?.name;
            if (farmerName) activeFilters.push(`Farmer: ${farmerName}`);
        }

        summaryDiv.innerHTML = `
            <h3>Purchase Summary</h3>
            ${activeFilters.length ? `
            <div class="active-filters">
                <p><strong>Active Filters:</strong> ${activeFilters.join(' | ')}</p>
            </div>
            ` : ''}
            <div class="summary-data">
                <div>
                    <label>Total Purchases:</label>
                    <p>${purchases.length}</p>
                </div>
                <div>
                    <label>Total Quantity:</label>
                    <p>${totalQuantity.toFixed(2)} kg</p>
                </div>
                <div>
                    <label>Total Cost:</label>
                    <p>$${totalCost.toFixed(2)}</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Farmer</th>
                        <th>Product Type</th>
                        <th>Quantity (kg)</th>
                        <th>Price/kg</th>
                        <th>Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${purchases.length ? purchases.map(p => `
                        <tr>
                            <td>${new Date(p.date).toLocaleDateString()}</td>
                            <td>${this.farmers[p.farmerId].name}</td>
                            <td>${p.productType}</td>
                            <td>${(p.quantity / 1000).toFixed(2)}</td>
                            <td>$${p.pricePerKg.toFixed(2)}</td>
                            <td>$${p.totalCost.toFixed(2)}</td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="6" class="no-results">No purchases found matching all selected filters</td>
                        </tr>
                    `}
                </tbody>
            </table>
        `;
    }
    showFarmerSummary(farmerId) {
        const farmer = this.farmers[farmerId];
        if (!farmer) {
            showMessage('Please select a farmer', 'error');
            return;
        }

        const farmerPurchases = this.purchases.filter(p => p.farmerId === farmerId);
        if (!farmerPurchases.length) {
            showMessage('No purchases found for this farmer', 'error');
            return;
        }

        const summary = {
            totalPurchases: farmerPurchases.length,
            totalQuantity: farmerPurchases.reduce((sum, p) => sum + p.quantity, 0) / 1000, // kg cinsinden
            totalCost: farmerPurchases.reduce((sum, p) => sum + p.totalCost, 0),
            averagePrice: farmerPurchases.reduce((sum, p) => sum + p.pricePerKg, 0) / farmerPurchases.length,
            productTypes: {}
        };

        // Summary by product type
        farmerPurchases.forEach(purchase => {
            if (!summary.productTypes[purchase.productType]) {
                summary.productTypes[purchase.productType] = {
                    quantity: 0,
                    totalCost: 0
                };
            }
            summary.productTypes[purchase.productType].quantity += purchase.quantity;
            summary.productTypes[purchase.productType].totalCost += purchase.totalCost;
        });

        // Show summary
        const summaryDiv = document.getElementById('summary-results');
        summaryDiv.innerHTML = `
            <h3>Farmer Summary: ${farmer.name}</h3>
            <div class="summary-data">
                <div>
                    <label>Total Purchases:</label>
                    <p>${summary.totalPurchases}</p>
                </div>
                <div>
                    <label>Total Quantity:</label>
                    <p>${summary.totalQuantity.toFixed(2)} kg</p>
                </div>
                <div>
                    <label>Total Cost:</label>
                    <p>$${summary.totalCost.toFixed(2)}</p>
                </div>
                <div>
                    <label>Average Price per kg:</label>
                    <p>$${summary.averagePrice.toFixed(2)}</p>
                </div>
            </div>
            
            <h4>Product Type Breakdown</h4>
            <table>
                <thead>
                    <tr>
                        <th>Product Type</th>
                        <th>Quantity (kg)</th>
                        <th>Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(summary.productTypes).map(([type, data]) => `
                        <tr>
                            <td>${type}</td>
                            <td>${(data.quantity / 1000).toFixed(2)} kg</td>
                            <td>$${data.totalCost.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    showDateRangeSummary(startDate, endDate) {
        if (!startDate || !endDate) {
            showMessage('Please select both start and end dates', 'error');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59); // End of day

        if (start > end) {
            showMessage('Start date cannot be after end date', 'error');
            return;
        }

        const rangePurchases = this.purchases.filter(p => {
            const purchaseDate = new Date(p.date);
            return purchaseDate >= start && purchaseDate <= end;
        });

        if (!rangePurchases.length) {
            showMessage('No purchases found in this date range', 'error');
            return;
        }

        const summary = {
            totalPurchases: rangePurchases.length,
            totalQuantity: rangePurchases.reduce((sum, p) => sum + p.quantity, 0) / 1000,
            totalCost: rangePurchases.reduce((sum, p) => sum + p.totalCost, 0),
            averagePrice: rangePurchases.reduce((sum, p) => sum + p.pricePerKg, 0) / rangePurchases.length,
            byProductType: {},
            byFarmer: {}
        };

        // Group by product type and farmer
        rangePurchases.forEach(purchase => {
            //By product type
            if (!summary.byProductType[purchase.productType]) {
                summary.byProductType[purchase.productType] = {
                    quantity: 0,
                    totalCost: 0
                };
            }
            summary.byProductType[purchase.productType].quantity += purchase.quantity;
            summary.byProductType[purchase.productType].totalCost += purchase.totalCost;

            // According to the farmer
            const farmerName = this.farmers[purchase.farmerId].name;
            if (!summary.byFarmer[farmerName]) {
                summary.byFarmer[farmerName] = {
                    quantity: 0,
                    totalCost: 0
                };
            }
            summary.byFarmer[farmerName].quantity += purchase.quantity;
            summary.byFarmer[farmerName].totalCost += purchase.totalCost;
        });

        // Show summary
        const summaryDiv = document.getElementById('summary-results');
        summaryDiv.innerHTML = `
            <h3>Date Range Summary (${start.toLocaleDateString()} - ${end.toLocaleDateString()})</h3>
            <div class="summary-data">
                <div>
                    <label>Total Purchases:</label>
                    <p>${summary.totalPurchases}</p>
                </div>
                <div>
                    <label>Total Quantity:</label>
                    <p>${summary.totalQuantity.toFixed(2)} kg</p>
                </div>
                <div>
                    <label>Total Cost:</label>
                    <p>$${summary.totalCost.toFixed(2)}</p>
                </div>
                <div>
                    <label>Average Price per kg:</label>
                    <p>$${summary.averagePrice.toFixed(2)}</p>
                </div>
            </div>
            
            <h4>By Product Type</h4>
            <table>
                <thead>
                    <tr>
                        <th>Product Type</th>
                        <th>Quantity (kg)</th>
                        <th>Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(summary.byProductType).map(([type, data]) => `
                        <tr>
                            <td>${type}</td>
                            <td>${(data.quantity / 1000).toFixed(2)} kg</td>
                            <td>$${data.totalCost.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <h4>By Farmer</h4>
            <table>
                <thead>
                    <tr>
                        <th>Farmer Name</th>
                        <th>Quantity (kg)</th>
                        <th>Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(summary.byFarmer).map(([name, data]) => `
                        <tr>
                            <td>${name}</td>
                            <td>${(data.quantity / 1000).toFixed(2)} kg</td>
                            <td>$${data.totalCost.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    // ui update
    updateUI() {
        this.updateFarmersTable();
        this.updateFarmerSelects();
        this.updateInventoryTable();
        this.updateOrdersTable();
        this.updatePurchasesTable();
        this.updateFinancialSummary();
        this.updateFilteredOrdersTable();
        this.updateFilteredOrdersTable();
        this.updateCategoryFilter();
    }

    updateFarmersTable() {
        const farmersTable = document.querySelector('#farmers-table tbody');
        const nameFilter = document.getElementById('farmer-filter-name')?.value.toLowerCase() || '';
        const emailFilter = document.getElementById('farmer-filter-email')?.value.toLowerCase() || '';
        const cityFilter = document.getElementById('farmer-filter-city')?.value.toLowerCase() || '';

        if (farmersTable) {
            farmersTable.innerHTML = '';
            Object.values(this.farmers)
                .filter(farmer =>
                    farmer.name.toLowerCase().includes(nameFilter) &&
                    farmer.email.toLowerCase().includes(emailFilter) &&
                    farmer.city.toLowerCase().includes(cityFilter)
                )
                .forEach(farmer => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${farmer.id}</td>
                        <td>${farmer.name}</td>
                        <td>${farmer.phone}</td>
                        <td>${farmer.email}</td>
                        <td>${farmer.city}</td>
                        <td>
                            <button onclick="editFarmer(${farmer.id})" class="edit-btn">Edit</button>
                            <button onclick="deleteFarmer(${farmer.id})" class="delete-btn">Delete</button>
                        </td>
                    `;
                    farmersTable.appendChild(row);
                });
        }
    }

    updateFarmerSelects() {
        const selects = [
            document.getElementById('farmer-select'),
            document.getElementById('farmer-summary-select')
        ];

        selects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Select Farmer</option>';
                Object.values(this.farmers).forEach(farmer => {
                    const option = document.createElement('option');
                    option.value = farmer.id;
                    option.textContent = farmer.name;
                    select.appendChild(option);
                });
            }
        });
    }

    updateInventoryTable() {
        const inventoryTable = document.querySelector('#inventory-table tbody');
        if (!inventoryTable) return;
     
        inventoryTable.innerHTML = '';
     
        // Unprocessed products
        Object.entries(this.inventory.unprocessedByType).forEach(([type, amount]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Unprocessed ${type.charAt(0).toUpperCase() + type.slice(1)}</td>
                <td>${(amount / 1000).toFixed(2)} kg</td>
                <td></td>
            `;
            inventoryTable.appendChild(row);
        });
     
        // Processed products 
        Object.entries(this.inventory.processed).forEach(([category, amount]) => {
            const row = document.createElement('tr');
            const packageSize = this.inventory.packageSizes[category];
            const isLowStock = amount <= this.inventory.minimumStock[category];
            
            let packageInfo;
            if (category === 'premium') {
                packageInfo = `Premium (${packageSize || 'Custom'}g)`;
            } else {
                packageInfo = `${category} (${packageSize}g)`;
            }
     
            row.innerHTML = `
                <td>${packageInfo}</td>
                <td>${amount} packages</td>
                <td>${isLowStock ? '<span class="low-stock-warning">Low Stock!</span>' : ''}</td>
            `;
     
            if (isLowStock) {
                row.classList.add('low-stock-row');
            }
     
            inventoryTable.appendChild(row);
        });
    }



    updateOrdersTable() {
        const ordersTable = document.querySelector('#orders-table tbody');
        if (ordersTable) {
            // Update table headers first
            const headerRow = document.querySelector('#orders-table thead tr');
            if (headerRow) {
                headerRow.innerHTML = `
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Shipping Info</th>
                    <th>Status</th>
                    <th>Actions</th>
                `;
            }
    
            // Then update the table content
            ordersTable.innerHTML = '';
            this.orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.customerName}</td>
                    <td>${order.category}</td>
                    <td>${order.quantity}</td>
                    <td>$${order.totalPrice.toFixed(2)}</td>
                    <td>${new Date(order.date).toLocaleDateString()}</td>
                    <td>${order.shippingInfo}</td>
                    <td>
                        <select onchange="updateOrderStatus(${order.id}, this.value)">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Processed" ${order.status === 'Processed' ? 'selected' : ''}>Processed</option>
                            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                    </td>
                    <td>
                        <button onclick="editOrder(${order.id})" class="edit-btn">Edit</button>
                        <button onclick="deleteOrder(${order.id})" class="delete-btn">Delete</button>
                    </td>
                `;
                ordersTable.appendChild(row);
            });
        }
    }

    updatePurchasesTable() {
        const purchasesTable = document.querySelector('#purchases-table tbody');
        if (purchasesTable) {
            // Update table headers
            const headerRow = document.querySelector('#purchases-table thead tr');
            if (headerRow) {
                headerRow.innerHTML = `
                    <th>ID</th>
                    <th>Farmer</th>
                    <th>Product Type</th>
                    <th>Quantity</th>
                    <th>Price/kg</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Actions</th>
                `;
            }
    
            purchasesTable.innerHTML = '';
            this.purchases.forEach(purchase => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${purchase.id}</td>
                    <td>${this.farmers[purchase.farmerId].name}</td>
                    <td>${purchase.productType.charAt(0).toUpperCase() + purchase.productType.slice(1)}</td>
                    <td>${(purchase.quantity / 1000).toFixed(2)} kg</td>
                    <td>$${purchase.pricePerKg.toFixed(2)}</td>
                    <td>$${purchase.totalCost.toFixed(2)}</td>
                    <td>${new Date(purchase.date).toLocaleDateString()}</td>
                    <td>
                        <button onclick="editPurchase(${purchase.id})" class="edit-btn">Edit</button>
                        <button onclick="deletePurchase(${purchase.id})" class="delete-btn">Delete</button>
                    </td>
                `;
                purchasesTable.appendChild(row);
            });
        }
    }


    updateFinancialSummary() {
        const summaryDiv = document.getElementById('financial-summary');
        if (summaryDiv) {
            const currentDate = new Date();
            const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            const currentYearKey = currentDate.getFullYear().toString();

            summaryDiv.innerHTML = `
                <h3>Financial Summary</h3>
                <div class="summary-data">
                    <div>
                        <label>Total Revenue:</label>
                        <p>$${this.financials.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div>
                        <label>Total Expenses:</label>
                        <p>$${this.financials.totalExpenses.toFixed(2)}</p>
                    </div>
                    <div>
                        <label>Tax Liability (${this.financials.taxRate * 100}%):</label>
                        <p>$${this.financials.taxLiability.toFixed(2)}</p>
                    </div>
                    <div>
                        <label>Net Profit:</label>
                        <p>$${this.financials.netProfit.toFixed(2)}</p>
                    </div>
                </div>

                <h4>Current Month Performance</h4>
                <div class="summary-data">
                    <div>
                        <label>Monthly Revenue:</label>
                        <p>$${(this.financials.monthlyStats[currentMonthKey]?.revenue || 0).toFixed(2)}</p>
                    </div>
                    <div>
                        <label>Monthly Expenses:</label>
                        <p>$${(this.financials.monthlyStats[currentMonthKey]?.expenses || 0).toFixed(2)}</p>
                    </div>
                    <div>
                        <label>Monthly Profit:</label>
                        <p>$${(this.financials.monthlyStats[currentMonthKey]?.profit || 0).toFixed(2)}</p>
                    </div>
                </div>

                <h4>Current Year Performance</h4>
                <div class="summary-data">
                    <div>
                        <label>Yearly Revenue:</label>
                        <p>$${(this.financials.yearlyStats[currentYearKey]?.revenue || 0).toFixed(2)}</p>
                    </div>
                    <div>
                        <label>Yearly Expenses:</label>
                        <p>$${(this.financials.yearlyStats[currentYearKey]?.expenses || 0).toFixed(2)}</p>
                    </div>
                    <div>
                        <label>Yearly Profit:</label>
                        <p>$${(this.financials.yearlyStats[currentYearKey]?.profit || 0).toFixed(2)}</p>
                    </div>
                </div>
            `;
        }
    }
}
// Create warehouse
const warehouse = new WarehouseManager();

// General helper functions
function showMessage(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const activeSection = document.querySelector('form:focus-within')?.closest('.section') ||
        document.querySelector('.section');
    activeSection.insertBefore(alertDiv, activeSection.firstChild);

    setTimeout(() => alertDiv.remove(), 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // farmer filter listeners
    const filterName = document.getElementById('farmer-filter-name');
    const filterEmail = document.getElementById('farmer-filter-email');
    const filterCity = document.getElementById('farmer-filter-city');

    if (filterName) filterName.addEventListener('input', () => warehouse.updateUI());
    if (filterEmail) filterEmail.addEventListener('input', () => warehouse.updateUI());
    if (filterCity) filterCity.addEventListener('input', () => warehouse.updateUI());

    // Order list filtering event listeners
    document.getElementById('filter-status')?.addEventListener('change', filterOrders);
    document.getElementById('filter-customer')?.addEventListener('input', filterOrders);
    document.getElementById('filter-category')?.addEventListener('change', filterOrders);

    // Form event listeners
    document.getElementById('farmer-form')?.addEventListener('submit', handleFarmerSubmit);
    document.getElementById('purchase-form')?.addEventListener('submit', handlePurchaseSubmit);
    document.getElementById('process-form')?.addEventListener('submit', handleProcessSubmit);
    document.getElementById('order-form')?.addEventListener('submit', handleOrderSubmit);


    // Price edit form listener
    document.getElementById('price-edit-form')?.addEventListener('submit', handlePriceEditSubmit);

    // Set date fields
    setupDateInputs();
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Set report date fields
    document.getElementById('report-start-date').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('report-end-date').value = today.toISOString().split('T')[0];
    document.getElementById('start-date')?.setAttribute('max', today.toISOString().split('T')[0]);
    document.getElementById('end-date')?.setAttribute('max', today.toISOString().split('T')[0]);

    document.getElementById('farmer-filter-name')?.addEventListener('input', () => warehouse.updateUI());
    document.getElementById('farmer-filter-email')?.addEventListener('input', () => warehouse.updateUI());
    document.getElementById('farmer-filter-city')?.addEventListener('input', () => warehouse.updateUI());


    // Update order category selection
    updateOrderCategorySelect();

    // Default report data
    const defaultData = {
        labels: [today.toISOString().split('T')[0]],
        values: [0],
        summary: {
            total: 0,
            average: 0,
            highest: 0,
            lowest: 0
        }
    };

    const filterContainer = document.querySelector('.filter-container');
    if (filterContainer) {
        filterContainer.innerHTML = `
            <div class="filters">
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="farmer-filter-name" placeholder="Search by name..." class="filter-input">
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="text" id="farmer-filter-email" placeholder="Search by email..." class="filter-input">
                </div>
                <div class="form-group">
                    <label>City:</label>
                    <input type="text" id="farmer-filter-city" placeholder="Search by city..." class="filter-input">
                </div>
            </div>
        `;

        // Add filtering event listeners
        document.getElementById('farmer-filter-name').addEventListener('input', () => warehouse.updateUI());
        document.getElementById('farmer-filter-email').addEventListener('input', () => warehouse.updateUI());
        document.getElementById('farmer-filter-city').addEventListener('input', () => warehouse.updateUI());
    }

    // Show default report
    displayReport('financial', defaultData);

    // update ui
    warehouse.updateUI();
});
document.addEventListener('DOMContentLoaded', () => {
    // Update form element
    const processFormContainer = document.querySelector('#process-form')?.parentElement;
    if (processFormContainer) {
        processFormContainer.innerHTML = processForm;
    }

    // Add event listeners
    document.getElementById('process-form')?.addEventListener('submit', handleProcessSubmit);
    document.getElementById('source-type')?.addEventListener('change', updateInventoryInfo);
});
// Form handlers
function handleFarmerSubmit(e) {
    e.preventDefault();
    try {
        const name = document.getElementById('farmer-name').value;
        const phone = document.getElementById('farmer-phone').value;
        const email = document.getElementById('farmer-email').value;
        const city = document.getElementById('farmer-city').value;

        validations.name(name);
        validations.phone(phone);
        validations.email(email);
        validations.city(city);

        warehouse.addFarmer(name, phone, email, city);

        //Clear form fields only
        document.getElementById('farmer-form').reset();

        showMessage('Farmer added successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}
function handlePurchaseSubmit(e) {
    e.preventDefault();
    try {
        const farmerId = document.getElementById('farmer-select').value;
        const productType = document.getElementById('product-type').value;
        const quantity = parseFloat(document.getElementById('purchase-quantity').value);
        const price = parseFloat(document.getElementById('purchase-price').value);
        const purchaseDate = document.getElementById('purchase-date').value;

        if (!farmerId) throw new Error('Please select a farmer');
        if (!productType) throw new Error('Please select a product type');
        if (quantity <= 0) throw new Error('Quantity must be positive');
        if (price <= 0) throw new Error('Price must be positive');

        warehouse.recordPurchase(farmerId, productType, quantity, price, purchaseDate);
        e.target.reset();
        document.getElementById('purchase-date').value = new Date().toISOString().split('T')[0];
        showMessage('Purchase recorded successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}
function handleProcessSubmit(e) {
    e.preventDefault();
    try {
        const sourceType = document.getElementById('source-type').value;
        const category = document.getElementById('category-select').value;
        const quantity = parseInt(document.getElementById('process-quantity').value);
        
        if (category === 'premium') {
            const packageSize = parseInt(document.getElementById('premium-size-input')?.value);
            if (!packageSize || packageSize < 100 || packageSize > 5000) {
                throw new Error('Premium package size must be between 100g and 5000g');
            }
            warehouse.inventory.packageSizes.premium = packageSize;
        }

        if (warehouse.processInventory(sourceType, category, quantity)) {
            e.target.reset();
            showMessage('Inventory processed successfully', 'success');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}
function updateInventoryInfo() {
    const sourceType = document.getElementById('source-type').value;
    const infoDiv = document.getElementById('inventory-info');

    if (sourceType && infoDiv) {
        const availableGrams = warehouse.inventory.getUnprocessedGrams(sourceType);
        infoDiv.innerHTML = `Available ${sourceType} inventory: ${(availableGrams / 1000).toFixed(2)} kg`;
    } else if (infoDiv) {
        infoDiv.innerHTML = '';
    }
}
function handleOrderSubmit(e) {
    e.preventDefault();
    try {
        const customerName = document.getElementById('customer-name').value;
        const contact = document.getElementById('customer-contact').value;
        const shippingInfo = document.getElementById('shipping-info').value;
        const category = document.getElementById('order-category').value;
        const quantity = parseInt(document.getElementById('order-quantity').value);
        const orderDate = document.getElementById('order-date').value;

        validations.customerName(customerName);
        validations.customerContact(contact);
        validations.shippingInfo(shippingInfo);
        validations.orderQuantity(quantity);

        warehouse.createOrder(customerName, contact, shippingInfo, category, quantity, orderDate);
        e.target.reset();
        document.getElementById('order-date').value = new Date().toISOString().split('T')[0];
        showMessage('Order created successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}
// Helper functions
function setupDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = [
        'purchase-date',
        'order-date'
    ];

    dateInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.max = today;
            input.value = today;
        }
    });
}
// Farmer edit
function editFarmer(id) {
    const farmer = warehouse.farmers[id];
    const form = document.getElementById('farmer-form');
    const addButton = form.querySelector('button[type="submit"]');

    // form with farmer information
    document.getElementById('farmer-name').value = farmer.name;
    document.getElementById('farmer-phone').value = farmer.phone;
    document.getElementById('farmer-email').value = farmer.email;
    document.getElementById('farmer-city').value = farmer.city;

    // Hide add button
    addButton.style.display = 'none';

    // Create edit buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';

    const doneButton = document.createElement('button');
    doneButton.type = 'button';
    doneButton.textContent = 'Done';
    doneButton.style.background = 'var(--secondary)';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.background = 'var(--danger)';

    buttonContainer.appendChild(doneButton);
    buttonContainer.appendChild(cancelButton);
    addButton.parentNode.appendChild(buttonContainer);

    // Done button codes
    doneButton.onclick = (e) => {
        e.preventDefault();
        try {
            const updates = {
                name: document.getElementById('farmer-name').value,
                phone: document.getElementById('farmer-phone').value,
                email: document.getElementById('farmer-email').value,
                city: document.getElementById('farmer-city').value
            };

            validations.name(updates.name);
            validations.phone(updates.phone);
            validations.email(updates.email);
            validations.city(updates.city);

            warehouse.updateFarmer(id, updates);
            resetForm();
            showMessage('Farmer updated successfully', 'success');
        } catch (error) {
            showMessage(error.message, 'error');
        }
    };

    // Cancel button codes
    cancelButton.onclick = () => {
        resetForm();
    };

    // Form reset helper function
    function resetForm() {
        form.reset();
        addButton.style.display = 'block';
        buttonContainer.remove();
    }
}
// farmer deletion
function deleteFarmer(id) {
    if (confirm('Are you sure you want to delete this farmer?')) {
        warehouse.deleteFarmer(id);
        showMessage('Farmer deleted successfully', 'success');
    }
}
// Order status update
function updateOrderStatus(orderId, newStatus) {
    if (warehouse.updateOrderStatus(orderId, newStatus)) {
        showMessage('Order status updated successfully', 'success');
    }
}
// Delete order
function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        if (warehouse.deleteOrder(orderId)) {
            showMessage('Order deleted successfully', 'success');
        } else {
            showMessage('Failed to delete order', 'error');
        }
    }
}
function editPrice(category, currentPrice, packageSize) {
    const editSection = document.getElementById('price-edit-section');
    const categoryInput = document.getElementById('price-category');
    const packageSizeInput = document.getElementById('package-size');
    const priceInput = document.getElementById('new-price');

    categoryInput.value = category;
    packageSizeInput.value = packageSize + 'g';
    priceInput.value = currentPrice;

    editSection.style.display = 'block';
    priceInput.focus();
}
function closePriceEdit() {
    document.getElementById('price-edit-section').style.display = 'none';
}
// updates the category selection
function updateOrderCategorySelect() {
    const orderCategorySelect = document.getElementById('order-category');
    if (orderCategorySelect) {
        orderCategorySelect.innerHTML = '<option value="">Select Category</option>';

        // Get categories from warehouse 
        const categories = Object.keys(warehouse.inventory.packageSizes);

        // Create an option element
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            // extra-large turns Extra Large
            option.textContent = category
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            orderCategorySelect.appendChild(option);
        });
    }
}
function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const startDate = new Date(document.getElementById('report-start-date').value);
    const endDate = new Date(document.getElementById('report-end-date').value);
    const grouping = document.getElementById('report-grouping').value;

    if (!startDate || !endDate) {
        showMessage('Please select both start and end dates', 'error');
        return;
    }

    const reportData = getReportData(reportType, startDate, endDate, grouping);
    displayReport(reportType, reportData);
}
function getReportData(reportType, startDate, endDate, grouping) {
    const data = {
        labels: [],
        values: [],
        summary: {
            total: 0,
            average: 0,
            highest: 0,
            lowest: Infinity
        }
    };

    // Get relevant data based on report type
    let relevantData = [];
    switch (reportType) {
        case 'financial':
            relevantData = getFinancialData(startDate, endDate);
            break;
        case 'sales':
            relevantData = getSalesData(startDate, endDate);
            break;
        case 'inventory':
            relevantData = getInventoryData(startDate, endDate);
            break;
    }

    groupData(relevantData, data, grouping);
    calculateSummary(data);
    return data;
}
function getFinancialData(startDate, endDate) {
    return warehouse.orders
        .filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= startDate && orderDate <= endDate;
        })
        .map(order => ({
            date: new Date(order.date),
            value: order.totalPrice,
            profit: order.totalPrice - (order.totalPrice * warehouse.financials.taxRate)
        }));
}
function getSalesData(startDate, endDate) {
    return warehouse.orders
        .filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= startDate && orderDate <= endDate;
        })
        .map(order => ({
            date: new Date(order.date),
            value: order.quantity,
            category: order.category
        }));
}
function getInventoryData(startDate, endDate) {
    return Object.entries(warehouse.inventory.processed).map(([category, amount]) => ({
        category: category,
        value: amount,
        packageSize: warehouse.inventory.packageSizes[category]
    }));
}
function groupData(rawData, data, grouping) {
    const groupedData = new Map();

    rawData.forEach(item => {
        let key;
        if (item.date) {
            switch (grouping) {
                case 'daily':
                    key = item.date.toISOString().split('T')[0];
                    break;
                case 'monthly':
                    key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'yearly':
                    key = item.date.getFullYear().toString();
                    break;
            }
        } else {
            key = item.category || item.type;
        }

        if (!groupedData.has(key)) {
            groupedData.set(key, 0);
        }
        groupedData.set(key, groupedData.get(key) + item.value);
    });

    data.labels = Array.from(groupedData.keys());
    data.values = Array.from(groupedData.values());
}
function editPurchase(id) {
    const purchase = warehouse.purchases.find(p => p.id === id);
    const form = document.getElementById('purchase-form');
    const addButton = form.querySelector('button[type="submit"]');

    // Fill the form with purchase information
    document.getElementById('farmer-select').value = purchase.farmerId;
    document.getElementById('product-type').value = purchase.productType;
    document.getElementById('purchase-quantity').value = (purchase.quantity / 1000).toFixed(2); // Convert to kg
    document.getElementById('purchase-price').value = purchase.pricePerKg;
    document.getElementById('purchase-date').value = new Date(purchase.date).toISOString().split('T')[0];

    // Hide add button
    addButton.style.display = 'none';

    // Create edit buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.className = 'edit-buttons';

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.textContent = 'Save Changes';
    saveButton.className = 'primary-btn';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'secondary-btn';

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    addButton.parentNode.appendChild(buttonContainer);

    // Save button event handler
    saveButton.onclick = (e) => {
        e.preventDefault();
        try {
            const updates = {
                farmerId: document.getElementById('farmer-select').value,
                productType: document.getElementById('product-type').value,
                quantity: parseFloat(document.getElementById('purchase-quantity').value),
                pricePerKg: parseFloat(document.getElementById('purchase-price').value),
                purchaseDate: document.getElementById('purchase-date').value
            };

            if (!updates.farmerId) throw new Error('Please select a farmer');
            if (!updates.productType) throw new Error('Please select a product type');
            if (updates.quantity <= 0) throw new Error('Quantity must be positive');
            if (updates.pricePerKg <= 0) throw new Error('Price must be positive');

            if (warehouse.updatePurchase(id, updates)) {
                resetForm();
                showMessage('Purchase updated successfully', 'success');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        }
    };

    // Cancel button event handler
    cancelButton.onclick = () => {
        resetForm();
    };

    // Form reset helper function
    function resetForm() {
        form.reset();
        addButton.style.display = 'block';
        buttonContainer.remove();
        
        // Reset date field to today
        document.getElementById('purchase-date').value = new Date().toISOString().split('T')[0];
    }
}
function deletePurchase(id) {
    if (confirm('Are you sure you want to delete this purchase?')) {
        if (warehouse.deletePurchase(id)) {
            showMessage('Purchase deleted successfully', 'success');
        } else {
            showMessage('Failed to delete purchase', 'error');
        }
    }
}
function editOrder(id) {
    const order = warehouse.orders.find(o => o.id === id);
    const form = document.getElementById('order-form');
    const addButton = form.querySelector('button[type="submit"]');

    // Fill form with order information
    document.getElementById('customer-name').value = order.customerName;
    document.getElementById('customer-contact').value = order.contact;
    document.getElementById('shipping-info').value = order.shippingInfo;
    document.getElementById('order-date').value = new Date(order.date).toISOString().split('T')[0];
    document.getElementById('order-category').value = order.category;
    document.getElementById('order-quantity').value = order.quantity;

    // Hide add button
    addButton.style.display = 'none';

    // Create edit buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.className = 'edit-buttons';

    const doneButton = document.createElement('button');
    doneButton.type = 'button';
    doneButton.textContent = 'Save Changes';
    doneButton.className = 'primary-btn';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'secondary-btn';

    buttonContainer.appendChild(doneButton);
    buttonContainer.appendChild(cancelButton);
    addButton.parentNode.appendChild(buttonContainer);

    // Done button event handler
    doneButton.onclick = (e) => {
        e.preventDefault();
        try {
            const updates = {
                customerName: document.getElementById('customer-name').value,
                contact: document.getElementById('customer-contact').value,
                shippingInfo: document.getElementById('shipping-info').value,
                category: document.getElementById('order-category').value,
                quantity: parseInt(document.getElementById('order-quantity').value),
                orderDate: document.getElementById('order-date').value
            };

            // Validate inputs
            validations.customerName(updates.customerName);
            validations.customerContact(updates.contact);
            validations.shippingInfo(updates.shippingInfo);
            validations.orderQuantity(updates.quantity);

            if (warehouse.updateOrder(id, updates)) {
                resetForm();
                showMessage('Order updated successfully', 'success');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        }
    };

    // Cancel button event handler
    cancelButton.onclick = () => {
        resetForm();
    };

    // Form reset helper function
    function resetForm() {
        form.reset();
        addButton.style.display = 'block';
        buttonContainer.remove();
        
        // Reset date field to today
        document.getElementById('order-date').value = new Date().toISOString().split('T')[0];
    }
}
function calculateSummary(data) {
    data.summary.total = data.values.reduce((sum, value) => sum + value, 0);
    data.summary.average = data.summary.total / data.values.length;
    data.summary.highest = Math.max(...data.values);
    data.summary.lowest = Math.min(...data.values);
}
function displayReport(reportType, data) {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    // Prevent NaN or undefined values in summary
    const summary = {
        total: isFinite(data.summary.total) ? data.summary.total : 0,
        average: isFinite(data.summary.average) ? data.summary.average : 0,
        highest: isFinite(data.summary.highest) ? data.summary.highest : 0,
        lowest: isFinite(data.summary.lowest) && data.summary.lowest !== Infinity ? data.summary.lowest : 0
    };

    let reportSummary = reportContent.querySelector('.report-summary');
    if (!reportSummary) {
        reportSummary = document.createElement('div');
        reportSummary.className = 'report-summary';
        reportContent.insertBefore(reportSummary, reportContent.firstChild);
    }

    // Update summary content with proper formatting
    reportSummary.innerHTML = `
        <h3>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Summary</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <label>Total:</label>
                <span>${formatValue(summary.total, reportType)}</span>
            </div>
            <div class="summary-item">
                <label>Average:</label>
                <span>${formatValue(summary.average, reportType)}</span>
            </div>
            <div class="summary-item">
                <label>Highest:</label>
                <span>${formatValue(summary.highest, reportType)}</span>
            </div>
            <div class="summary-item">
                <label>Lowest:</label>
                <span>${formatValue(summary.lowest, reportType)}</span>
            </div>
        </div>
    `;

    // Detail table with data validation
    let reportDetails = reportContent.querySelector('.report-details');
    if (!reportDetails) {
        reportDetails = document.createElement('div');
        reportDetails.className = 'report-details';
        reportContent.appendChild(reportDetails);
    }

    reportDetails.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Period</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                ${data.labels.map((label, index) => `
                    <tr>
                        <td>${label || 'N/A'}</td>
                        <td>${formatValue(data.values[index] || 0, reportType)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
function formatValue(value, reportType) {
    switch (reportType) {
        case 'financial':
            return `$${value.toFixed(2)}`;
        case 'inventory':
            return `${value} units`;
        default:
            return value.toFixed(2);
    }
}
function filterOrders() {
    warehouse.updateFilteredOrdersTable();
}
function handlePurchaseSort(sortCriteria) {
    warehouse.handlePurchaseSort(sortCriteria);
}
function showFarmerSummary() {
    const farmerId = document.getElementById('farmer-summary-select').value;
    if (!farmerId) {
        showMessage('Please select a farmer', 'error');
        return;
    }
    warehouse.showFarmerSummary(farmerId);
}
function showDateRangeSummary() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    warehouse.showDateRangeSummary(startDate, endDate);
}
function exportReportToCSV() {
    const reportType = document.getElementById('report-type').value;
    const startDate = new Date(document.getElementById('report-start-date').value);
    const endDate = new Date(document.getElementById('report-end-date').value);
    const grouping = document.getElementById('report-grouping').value;

    if (!startDate || !endDate) {
        showMessage('Please select both start and end dates', 'error');
        return;
    }

    const data = getReportData(reportType, startDate, endDate, grouping);
    const csvContent = [
        ['Period', 'Value'],
        ...data.labels.map((label, index) => [label, data.values[index]])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${reportType}-report.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
const categorySelect = document.getElementById('category-select');

categorySelect.addEventListener('change', function() {
    const containerDiv = this.parentElement;
    let packageSizeInput = document.getElementById('premium-size-input');
    
    if (this.value === 'premium') {
        if (!packageSizeInput) {
            const inputDiv = document.createElement('div');
            inputDiv.classList.add('form-group');
            inputDiv.innerHTML = `
                <label>Premium Package Size (grams):</label>
                <input type="number" id="premium-size-input" min="100" max="5000" step="100" required>
            `;
            this.parentElement.insertBefore(inputDiv, this.nextSibling);
        }
    } else if (packageSizeInput) {
        packageSizeInput.parentElement.remove();
    }
});
// Menu item click handler
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            window.scrollTo({
                top: targetSection.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for all filter elements
    const filterElements = [
        'sort-purchases',
        'filter-product-type',
        'start-date',
        'end-date',
        'farmer-summary-select'
    ];

    filterElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', () => {
                const sortCriteria = document.getElementById('sort-purchases').value;
                warehouse.handlePurchaseSort(sortCriteria);
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Set default dates
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    document.getElementById('report-start-date').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('report-end-date').value = today.toISOString().split('T')[0];
});

document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for all filter elements
    const filterElements = [
        'sort-purchases',
        'filter-product-type',
        'start-date',
        'end-date',
        'farmer-summary-select'
    ];

    filterElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', () => {
                const sortCriteria = document.getElementById('sort-purchases').value;
                warehouse.handlePurchaseSort(sortCriteria);
            });
        }
    });

    // Fill date today date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date')?.setAttribute('max', today);
    document.getElementById('end-date')?.setAttribute('max', today);
});

document.getElementById('price-edit-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const category = document.getElementById('price-category').value;
        const newPrice = parseFloat(document.getElementById('new-price').value);
        updateOrderCategorySelect
        if (warehouse.updateProductPrice(category, newPrice)) {
            closePriceEdit();
            showMessage(`Price updated for ${category}`, 'success');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateOrderCategorySelect();
})

const originalUpdateUI = warehouse.updateUI;
warehouse.updateUI = function (sortCriteria = null) {
    originalUpdateUI.call(this, sortCriteria);
    this.updatePriceTable();
    updateOrderCategorySelect()
};
document.addEventListener('DOMContentLoaded', () => {
    // Fill date today date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date')?.setAttribute('max', today);
    document.getElementById('end-date')?.setAttribute('max', today);
});

// Scroll event listener for active menu item
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('.nav-item');

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            currentSection = '#' + section.id;
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === currentSection) {
            item.classList.add('active');
        }
    });
});

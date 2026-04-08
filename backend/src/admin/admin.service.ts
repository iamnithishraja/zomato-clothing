import AdminModel from './admin.model';
import { generateOTP } from '../utils/otp';
import { sendPhoneOtp } from '../utils/sms';
import { generateAdminToken } from '../utils/token';
import type { Admin } from '../types/admin';
import UserModel from '../Models/userModel';
import OrderModel from '../Models/orderModel';
import StoreModel from '../Models/storeModel';
import PaymentModel from '../Models/paymentModel';
import DeliveryModel from '../Models/deliveryModel';

export class AdminService {
  /** Escape user input used inside MongoDB $regex to reduce ReDoS / injection issues */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Calendar YYYY-MM-DD → server-local start/end of day for `createdAt` range filters */
  private static parseDateRangeFilter(
    dateFrom?: string,
    dateTo?: string,
  ): { $gte?: Date; $lte?: Date } | null {
    if (!dateFrom && !dateTo) return null;
    const range: { $gte?: Date; $lte?: Date } = {};
    if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      const [y, m, d] = dateFrom.split('-').map(Number);
      range.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      const [y, m, d] = dateTo.split('-').map(Number);
      range.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
    }
    if (range.$gte === undefined && range.$lte === undefined) return null;
    return range;
  }

  // Create new admin
  static async createAdmin(adminData: {
    username: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ admin: Admin; token: string }> {
    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({
      $or: [
        { email: adminData.email },
        { username: adminData.username },
        ...(adminData.phone ? [{ phone: adminData.phone }] : [])
      ]
    });

    if (existingAdmin) {
      if (existingAdmin.email === adminData.email) {
        throw new Error('Admin with this email already exists');
      }
      if (existingAdmin.username === adminData.username) {
        throw new Error('Admin with this username already exists');
      }
      if (existingAdmin.phone === adminData.phone) {
        throw new Error('Admin with this phone number already exists');
      }
    }

    // Create new admin
    const admin = new AdminModel(adminData);
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id.toString());

    // Remove password from response
    const adminResponse: any = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.otp;

    return { admin: adminResponse, token };
  }

  // Login with username and password
  static async loginWithPassword(credentials: {
    username: string;
    password: string;
  }): Promise<{ admin: Admin; token: string }> {
    // Find admin by username or email
    const admin = await AdminModel.findOne({
      $or: [
        { username: credentials.username },
        { email: credentials.username }
      ]
    });

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id.toString());

    // Remove password from response
    const adminResponse: any = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.otp;

    return { admin: adminResponse, token };
  }

  // Request OTP for phone login
  static async requestOTP(phone: string): Promise<void> {
    // Clean and validate phone number (reuse existing validation)
    const phoneValidation = this.cleanAndValidatePhone(phone);
    if (!phoneValidation.isValid) {
      throw new Error(phoneValidation.error || 'Invalid phone number format');
    }

    const cleanPhone = phoneValidation.cleanPhone;

    // Find admin by phone
    const admin = await AdminModel.findOne({ phone: cleanPhone });
    if (!admin) {
      throw new Error('No admin account found with this phone number');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    // Generate OTP
    const otp = admin.generateOTP();
    await admin.save();

    // Send OTP
    const smsResult = await sendPhoneOtp(cleanPhone, otp);
    if (!smsResult) {
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  // Verify OTP and login
  static async verifyOTPAndLogin(phone: string, otp: string): Promise<{ admin: Admin; token: string }> {
    // Clean and validate phone number
    const phoneValidation = this.cleanAndValidatePhone(phone);
    if (!phoneValidation.isValid) {
      throw new Error(phoneValidation.error || 'Invalid phone number format');
    }

    const cleanPhone = phoneValidation.cleanPhone;

    // Find admin by phone
    const admin = await AdminModel.findOne({ phone: cleanPhone });
    if (!admin) {
      throw new Error('No admin account found with this phone number');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    // Verify OTP
    const isOTPValid = admin.verifyOTP(otp);
    if (!isOTPValid) {
      throw new Error('Invalid or expired OTP');
    }

    // Clear OTP after successful verification
    admin.clearOTP();
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id.toString());

    // Remove password from response
    const adminResponse: any = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.otp;

    return { admin: adminResponse, token };
  }

  // Get admin profile
  static async getAdminProfile(adminId: string): Promise<Admin> {
    const admin = await AdminModel.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    // Remove sensitive data
    const adminResponse: any = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.otp;

    return adminResponse;
  }

  // ─── Dashboard: Analytics Overview ────────────────────────────────────────
  static async getAnalyticsOverview(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all count queries in parallel
    const [
      totalUsers,
      totalMerchants,
      totalDeliveryPartners,
      totalCustomers,
      totalOrders,
      totalStores,
      newUsersLast30,
      roleBreakdown,
      ordersTrendDaily,
      ordersTrendWeekly,
      ordersTrendMonthly,
      categoryWiseSales,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: 'Merchant' }),
      UserModel.countDocuments({ role: 'Delivery' }),
      UserModel.countDocuments({ role: 'User' }),
      OrderModel.countDocuments(),
      StoreModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      UserModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      // Daily orders trend (last 30 days)
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Weekly orders trend (last 12 weeks)
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $isoWeek: '$createdAt' },
            year: { $first: { $isoWeekYear: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { year: 1, _id: 1 } },
      ]),
      // Monthly orders trend (last 12 months)
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Category-wise sales from order items
      OrderModel.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Rejected'] } } },
        { $unwind: '$orderItems' },
        {
          $lookup: {
            from: 'products',
            localField: 'orderItems.product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$productInfo.category',
            totalSold: { $sum: '$orderItems.quantity' },
            totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]),
    ]);

    // Format role breakdown into an object
    const roles: Record<string, number> = {};
    roleBreakdown.forEach((r: any) => {
      roles[r._id || 'Unknown'] = r.count;
    });

    return {
      totalUsers,
      totalMerchants,
      totalDeliveryPartners,
      totalCustomers,
      totalOrders,
      totalStores,
      newUsersLast30Days: newUsersLast30,
      roleBreakdown: roles,
      ordersTrend: {
        daily: ordersTrendDaily.map((d: any) => ({ date: d._id, count: d.count, revenue: d.revenue })),
        weekly: ordersTrendWeekly.map((w: any) => ({ week: w._id, year: w.year, count: w.count, revenue: w.revenue })),
        monthly: ordersTrendMonthly.map((m: any) => ({ month: m._id, count: m.count, revenue: m.revenue })),
      },
      categoryWiseSales: categoryWiseSales.map((c: any) => ({
        category: c._id || 'Unknown',
        totalSold: c.totalSold,
        totalRevenue: c.totalRevenue,
      })),
    };
  }

  // ─── Dashboard: Finance Summary ─────────────────────────────────────────────
  static async getFinanceSummary(): Promise<any> {
    const [
      gmvResult,
      paymentStatusBreakdown,
      paymentMethodBreakdown,
      recentRevenueByMonth,
    ] = await Promise.all([
      // GMV: total value of all non-cancelled orders
      OrderModel.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Rejected'] } } },
        {
          $group: {
            _id: null,
            gmv: { $sum: '$totalAmount' },
            totalDeliveryFees: { $sum: '$deliveryFee' },
            orderCount: { $sum: 1 },
          },
        },
      ]),
      // Payment status breakdown
      PaymentModel.aggregate([
        { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      // Payment method breakdown
      PaymentModel.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      // Monthly revenue last 6 months
      OrderModel.aggregate([
        {
          $match: {
            status: { $nin: ['Cancelled', 'Rejected'] },
            createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const gmv = gmvResult[0]?.gmv || 0;
    const deliveryFees = gmvResult[0]?.totalDeliveryFees || 0;
    const orderCount = gmvResult[0]?.orderCount || 0;

    // Format payment status into named fields
    const statusMap: Record<string, { count: number; total: number }> = {};
    paymentStatusBreakdown.forEach((p: any) => {
      statusMap[p._id || 'Unknown'] = { count: p.count, total: p.total };
    });

    const methodMap: Record<string, { count: number; total: number }> = {};
    paymentMethodBreakdown.forEach((p: any) => {
      methodMap[p._id || 'Unknown'] = { count: p.count, total: p.total };
    });

    return {
      gmv,
      totalDeliveryFees: deliveryFees,
      totalOrders: orderCount,
      platformCommission: gmv * 0.05, // 5% platform commission estimate
      successPayments: statusMap['Completed'] || { count: 0, total: 0 },
      failedPayments: statusMap['Failed'] || { count: 0, total: 0 },
      pendingPayments: statusMap['Pending'] || { count: 0, total: 0 },
      refundedPayments: statusMap['Refunded'] || { count: 0, total: 0 },
      paymentMethodBreakdown: methodMap,
      revenueByMonth: recentRevenueByMonth.map((m: any) => ({
        month: m._id,
        revenue: m.revenue,
        orders: m.orders,
      })),
    };
  }

  // ─── Dashboard: Transactions List ───────────────────────────────────────────
  static async getTransactions(query: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status && query.status !== 'all') {
      filter.paymentStatus = query.status;
    }
    if (query.method && query.method !== 'all') {
      filter.paymentMethod = query.method;
    }
    const txRange = AdminService.parseDateRangeFilter(query.dateFrom, query.dateTo);
    if (txRange) {
      filter.createdAt = txRange;
    }

    const [transactions, total] = await Promise.all([
      PaymentModel.find(filter)
        .populate('order', 'orderNumber totalAmount status')
        .populate('user', 'name phone email')
        .populate('store', 'storeName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentModel.countDocuments(filter),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Dashboard: All Orders ──────────────────────────────────────────────────
  static async getAllOrders(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentMethod?: string;
    paymentStatus?: string;
  }): Promise<any> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }
    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }
    const ordRange = AdminService.parseDateRangeFilter(query.dateFrom, query.dateTo);
    if (ordRange) {
      filter.createdAt = ordRange;
    }
    if (query.search) {
      const safe = AdminService.escapeRegex(query.search.trim());
      if (safe) {
        filter.$or = [
          { orderNumber: { $regex: safe, $options: 'i' } },
          { shippingAddress: { $regex: safe, $options: 'i' } },
        ];
      }
    }

    const breakdownFilter = { ...filter };
    delete breakdownFilter.status;

    const [orders, total, statusCounts] = await Promise.all([
      OrderModel.find(filter)
        .populate('user', 'name phone email')
        .populate('store', 'storeName')
        .populate('deliveryPerson', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(filter),
      OrderModel.aggregate([
        { $match: breakdownFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => {
      statusMap[s._id] = s.count;
    });

    return {
      orders,
      statusCounts: statusMap,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Dashboard: Get Order By ID ─────────────────────────────────────────────
  static async getOrderById(orderId: string): Promise<any> {
    const order = await OrderModel.findById(orderId)
      .populate('user', 'name phone email avatar')
      .populate('store', 'storeName address contact')
      .populate('deliveryPerson', 'name phone avatar')
      .populate('orderItems.product', 'name images category subcategory price')
      .populate('paymentId')
      .lean();

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  // ─── Dashboard: Force Cancel Order ──────────────────────────────────────────
  static async forceCancelOrder(orderId: string, reason: string): Promise<any> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    order.status = 'Cancelled';
    order.cancellationReason = reason || 'Force cancelled by admin';
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: `Force cancelled by admin: ${reason || 'No reason provided'}`,
    });

    await order.save();

    // Also cancel any associated delivery
    await DeliveryModel.updateMany(
      { order: order._id, status: { $nin: ['Delivered', 'Cancelled'] } },
      {
        $set: {
          status: 'Cancelled',
          cancellationReason: 'Order force cancelled by admin',
        },
      }
    );

    // Update payment status if pending
    await PaymentModel.updateMany(
      { order: order._id, paymentStatus: 'Pending' },
      { $set: { paymentStatus: 'Failed' } }
    );

    return order;
  }

  // ─── Dashboard: All Users ───────────────────────────────────────────────────
  static async getAllUsers(query: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<any> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.role && query.role !== 'all') {
      filter.role = query.role;
    }
    if (query.search) {
      const safe = AdminService.escapeRegex(query.search.trim());
      if (safe) {
        filter.$or = [
          { name: { $regex: safe, $options: 'i' } },
          { phone: { $regex: safe, $options: 'i' } },
          { email: { $regex: safe, $options: 'i' } },
        ];
      }
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select('-password -otp -otpExpiry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Dashboard: User Stats ──────────────────────────────────────────────────
  static async getUserStats(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      roleBreakdown,
      newUsersLast30,
      profileCompletionStats,
      registrationTrend,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      UserModel.aggregate([
        {
          $group: {
            _id: '$isProfileComplete',
            count: { $sum: 1 },
          },
        },
      ]),
      // Registration trend last 30 days
      UserModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const roles: Record<string, number> = {};
    roleBreakdown.forEach((r: any) => {
      roles[r._id || 'Unknown'] = r.count;
    });

    const profileCompletion: Record<string, number> = {};
    profileCompletionStats.forEach((p: any) => {
      profileCompletion[p._id ? 'complete' : 'incomplete'] = p.count;
    });

    return {
      totalUsers,
      roleBreakdown: roles,
      newUsersLast30Days: newUsersLast30,
      profileCompletion,
      registrationTrend: registrationTrend.map((r: any) => ({
        date: r._id,
        count: r.count,
      })),
    };
  }

  // ─── Dashboard: Delivery Partners ───────────────────────────────────────────
  static async getDeliveryPartners(query: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<any> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = { role: 'Delivery' };
    if (query.status === 'online') {
      filter.isActive = true;
      filter.isBusy = false;
    } else if (query.status === 'busy') {
      filter.isBusy = true;
    } else if (query.status === 'offline') {
      filter.isActive = false;
    }

    const [partners, total] = await Promise.all([
      UserModel.find(filter)
        .select('-password -otp -otpExpiry')
        .populate('currentOrder', 'orderNumber status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    // Get delivery stats for each partner
    const partnerIds = partners.map((p: any) => p._id);
    const deliveryStats = await DeliveryModel.aggregate([
      { $match: { deliveryPerson: { $in: partnerIds } } },
      {
        $group: {
          _id: '$deliveryPerson',
          totalDeliveries: { $sum: 1 },
          completedDeliveries: {
            $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
          },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const statsMap: Record<string, any> = {};
    deliveryStats.forEach((s: any) => {
      statsMap[s._id.toString()] = {
        totalDeliveries: s.totalDeliveries,
        completedDeliveries: s.completedDeliveries,
        avgRating: s.avgRating ? Math.round(s.avgRating * 10) / 10 : null,
      };
    });

    const enrichedPartners = partners.map((p: any) => ({
      ...p,
      deliveryStats: statsMap[p._id.toString()] || {
        totalDeliveries: 0,
        completedDeliveries: 0,
        avgRating: null,
      },
    }));

    return {
      partners: enrichedPartners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Dashboard: Delivery Stats ──────────────────────────────────────────────
  static async getDeliveryStats(): Promise<any> {
    const [
      totalPartners,
      activePartners,
      busyPartners,
      offlinePartners,
      deliveryStatusBreakdown,
      avgDeliveryRating,
    ] = await Promise.all([
      UserModel.countDocuments({ role: 'Delivery' }),
      UserModel.countDocuments({ role: 'Delivery', isActive: true, isBusy: false }),
      UserModel.countDocuments({ role: 'Delivery', isBusy: true }),
      UserModel.countDocuments({ role: 'Delivery', isActive: false }),
      DeliveryModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      DeliveryModel.aggregate([
        { $match: { rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),
    ]);

    const statusMap: Record<string, number> = {};
    deliveryStatusBreakdown.forEach((s: any) => {
      statusMap[s._id] = s.count;
    });

    return {
      totalPartners,
      activePartners,
      busyPartners,
      offlinePartners,
      deliveryStatusBreakdown: statusMap,
      avgDeliveryRating: avgDeliveryRating[0]?.avgRating
        ? Math.round(avgDeliveryRating[0].avgRating * 10) / 10
        : null,
    };
  }

  // ─── Dashboard: Store Performance ───────────────────────────────────────────
  static async getStorePerformance(query: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<any> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const allowedSort = new Set(['totalRevenue', 'totalOrders', 'returnRate', 'rating']);
    const sortBy = allowedSort.has(query.sortBy || '') ? (query.sortBy as string) : 'totalRevenue';
    const sortDir: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;

    const sortMongoKey =
      sortBy === 'rating' ? 'ratingAverage' : `orderStats.${sortBy}`;

    const totalStores = await StoreModel.countDocuments();

    const pipeline = [
      {
        $lookup: {
          from: 'orders',
          let: { storeId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$store', '$$storeId'] } } },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
                deliveredOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
                },
                cancelledOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] },
                },
              },
            },
          ],
          as: 'orderAgg',
        },
      },
      {
        $addFields: {
          orderStatsRaw: { $arrayElemAt: ['$orderAgg', 0] },
        },
      },
      {
        $addFields: {
          orderStats: {
            totalOrders: { $ifNull: ['$orderStatsRaw.totalOrders', 0] },
            totalRevenue: { $ifNull: ['$orderStatsRaw.totalRevenue', 0] },
            deliveredOrders: { $ifNull: ['$orderStatsRaw.deliveredOrders', 0] },
            cancelledOrders: { $ifNull: ['$orderStatsRaw.cancelledOrders', 0] },
          },
        },
      },
      {
        $addFields: {
          'orderStats.returnRate': {
            $cond: [
              { $gt: ['$orderStats.totalOrders', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: ['$orderStats.cancelledOrders', '$orderStats.totalOrders'],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },
          ratingAverage: { $ifNull: ['$rating.average', 0] },
        },
      },
      { $project: { orderAgg: 0, orderStatsRaw: 0 } },
      { $sort: { [sortMongoKey]: sortDir } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          let: { mid: '$merchantId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$mid'] } } },
            { $project: { name: 1, phone: 1, email: 1 } },
          ],
          as: 'ownerArr',
        },
      },
      {
        $addFields: {
          owner: { $arrayElemAt: ['$ownerArr', 0] },
        },
      },
      { $project: { ownerArr: 0, ratingAverage: 0, merchantId: 0 } },
    ];

    const rows = await StoreModel.aggregate(pipeline);

    const stores = rows.map((s: any) => ({
      _id: s._id,
      storeName: s.storeName,
      owner: s.owner || null,
      rating: s.rating,
      isActive: s.isActive,
      createdAt: s.createdAt,
      orderStats: s.orderStats,
    }));

    return {
      stores,
      pagination: {
        page,
        limit,
        total: totalStores,
        totalPages: Math.ceil(totalStores / limit),
      },
    };
  }

  // ─── Dashboard: Single store detail (performance + recent orders) ───────────
  static async getStoreDetail(storeId: string): Promise<any> {
    const store = await StoreModel.findById(storeId).lean();
    if (!store) {
      throw new Error('Store not found');
    }

    const sid = store._id;
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const owner = await UserModel.findById((store as any).merchantId)
      .select('name phone email')
      .lean();

    const [orderAgg, statusBreakdown, ordersTrend, recentOrders] = await Promise.all([
      OrderModel.aggregate([
        { $match: { store: sid } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] },
            },
          },
        },
      ]),
      OrderModel.aggregate([
        { $match: { store: sid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      OrderModel.aggregate([
        { $match: { store: sid, createdAt: { $gte: ninetyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      OrderModel.find({ store: sid })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('user', 'name phone')
        .populate('deliveryPerson', 'name phone')
        .select(
          'orderNumber totalAmount status paymentMethod paymentStatus createdAt user deliveryPerson',
        )
        .lean(),
    ]);

    const raw = orderAgg[0];
    const totalOrders = raw?.totalOrders ?? 0;
    const cancelledOrders = raw?.cancelledOrders ?? 0;
    const returnRate =
      totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 1000) / 10 : 0;

    const orderStatusBreakdown: Record<string, number> = {};
    statusBreakdown.forEach((s: any) => {
      orderStatusBreakdown[s._id] = s.count;
    });

    const s = store as any;

    return {
      store: {
        _id: s._id,
        storeName: s.storeName,
        address: s.address,
        description: s.description,
        isActive: s.isActive,
        rating: s.rating,
        contact: s.contact,
        createdAt: s.createdAt,
        owner: owner
          ? { name: owner.name, phone: owner.phone, email: owner.email }
          : null,
      },
      orderStats: {
        totalOrders,
        totalRevenue: raw?.totalRevenue ?? 0,
        deliveredOrders: raw?.deliveredOrders ?? 0,
        cancelledOrders,
        returnRate,
      },
      orderStatusBreakdown,
      ordersTrendDaily: ordersTrend.map((d: any) => ({
        date: d._id,
        orders: d.orders,
        revenue: d.revenue,
      })),
      recentOrders,
    };
  }

  // Utility function to clean and validate phone numbers (reused from userController)
  private static cleanAndValidatePhone(phone: string): { cleanPhone: string; isValid: boolean; error?: string } {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Remove country code if present (91 for India)
    const withoutCountryCode = cleaned.replace(/^91/, '');
    
    // Validate length
    if (withoutCountryCode.length !== 10) {
      return {
        cleanPhone: '',
        isValid: false,
        error: 'Phone number must be exactly 10 digits after removing country code'
      };
    }
    
    // Validate that it's a valid Indian mobile number (starts with 6, 7, 8, or 9)
    if (!/^[6-9]/.test(withoutCountryCode)) {
      return {
        cleanPhone: '',
        isValid: false,
        error: 'Invalid phone number. Indian mobile numbers must start with 6, 7, 8, or 9'
      };
    }
    
    return {
      cleanPhone: withoutCountryCode,
      isValid: true
    };
  }
}

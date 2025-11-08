import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/common/card";
import { Button } from "@/components/common/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { adminService } from "@/services/adminService";
import { toast } from "react-hot-toast";

// Helper function to determine timeRange based on date range
const getTimeRange = (startDate, endDate) => {
  const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 'today';
  if (diffDays <= 7) return 'week';
  if (diffDays <= 30) return 'month';
  return 'year';
};



const RevenueStats = () => {
const [data, setData] = useState([]);
const [summary, setSummary] = useState({ total: 0 });
const [startDate, setStartDate] = useState(new Date("2025-01-01"));
const [endDate, setEndDate] = useState(new Date());

const fetchData = async () => {
    try {
      // Lấy thống kê doanh thu từ order service
      const response = await adminService.getStatistics({
        timeRange: getTimeRange(startDate, endDate),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const statsData = response.data;
      
      // Format dữ liệu cho biểu đồ
      const formattedData = statsData.revenueByPeriod.map(item => ({
        date: item._id.date,
        revenue: item.revenue,
        orders: item.orders
      }));

      // Dữ liệu theo nhà hàng (từ statusDistribution)
      const restaurantData = statsData.statusDistribution
        .filter(item => item._id === 'completed')
        .map(item => ({
          restaurant: item.restaurantName || 'Unknown',
          revenue: item.revenue || 0,
          orders: item.count || 0
        }));

      setData([...formattedData, ...restaurantData]);
      setSummary({ 
        total: statsData.totalRevenue || 0,
        totalOrders: statsData.completed || 0 // Chỉ đếm đơn đã hoàn thành
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Không thể tải dữ liệu doanh thu');
    }
};

useEffect(() => {
    fetchData();
}, []);

return (
    <div className="p-6 space-y-6">
    <h2 className="text-2xl font-bold">📊 Thống kê doanh thu theo thời gian</h2>

      {/* Bộ lọc thời gian */}
    <div className="flex gap-4 items-center">
        <div>
        <label className="block text-sm font-medium">Từ ngày:</label>
        <DatePicker selected={startDate} onChange={(d) => setStartDate(d)} className="border p-2 rounded-md" />
        </div>
        <div>
        <label className="block text-sm font-medium">Đến ngày:</label>
        <DatePicker selected={endDate} onChange={(d) => setEndDate(d)} className="border p-2 rounded-md" />
        </div>
        <Button onClick={fetchData}>Lọc</Button>
    </div>

      {/* Tổng doanh thu */}
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="shadow-md bg-white">
          <CardContent className="p-6">
          <h3 className="text-lg font-semibold">Tổng doanh thu</h3>
          <p className="text-3xl font-bold text-green-600">{summary.total?.toLocaleString() || 0} ₫</p>
          {summary.percentChange !== 0 && (
            <p className={`text-sm ${summary.percentChange > 0 ? 'text-green-600' : 'text-red-600'} mt-2`}>
              {summary.percentChange > 0 ? '↑' : '↓'} {Math.abs(summary.percentChange)}% so với kỳ trước
            </p>
          )}
          </CardContent>
      </Card>
      
      <Card className="shadow-md bg-white">
          <CardContent className="p-6">
          <h3 className="text-lg font-semibold">Tổng số đơn hàng</h3>
          <p className="text-3xl font-bold text-blue-600">{summary.totalOrders?.toLocaleString() || 0}</p>
          </CardContent>
      </Card>

      <Card className="shadow-md bg-white">
          <CardContent className="p-6">
          <h3 className="text-lg font-semibold">Giá trị đơn trung bình</h3>
          <p className="text-3xl font-bold text-purple-600">
            {summary.averageOrderValue?.toLocaleString() || 0} ₫
          </p>
          </CardContent>
      </Card>

      <Card className="shadow-md bg-white">
          <CardContent className="p-6">
          <h3 className="text-lg font-semibold">Tỷ lệ hoàn thành</h3>
          <p className="text-3xl font-bold text-orange-600">
            {((summary.completedOrders / summary.totalOrders) * 100 || 0).toFixed(1)}%
          </p>
          </CardContent>
      </Card>
    </div>

      {/* Biểu đồ cột theo nhà hàng */}
    <Card className="shadow-md bg-white">
        <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Doanh thu theo từng nhà hàng</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="restaurant" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
        </ResponsiveContainer>
        </CardContent>
    </Card>

      {/* Biểu đồ đường theo ngày */}
    <Card className="shadow-md bg-white">
        <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Doanh thu theo ngày</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
        </ResponsiveContainer>
        </CardContent>
    </Card>
    </div>
);
};

export default RevenueStats;

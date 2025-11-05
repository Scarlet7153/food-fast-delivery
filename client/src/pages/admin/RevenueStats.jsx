import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/common/card";
import { Button } from "@/components/common/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";



const RevenueStats = () => {
const [data, setData] = useState([]);
const [summary, setSummary] = useState({ total: 0 });
const [startDate, setStartDate] = useState(new Date("2025-01-01"));
const [endDate, setEndDate] = useState(new Date());

  // Giả lập API
const fetchData = async () => {
    // Nếu có API thật thì thay dòng này bằng axios.get("/api/revenue?startDate=...&endDate=...")
const mockData = [
    { date: "2025-11-01", restaurant: "FastFood A", revenue: 2000000 },
    { date: "2025-11-01", restaurant: "FastFood B", revenue: 3000000 },
    { date: "2025-11-02", restaurant: "FastFood A", revenue: 2500000 },
    { date: "2025-11-02", restaurant: "FastFood B", revenue: 2700000 },
    { date: "2025-11-03", restaurant: "FastFood A", revenue: 3100000 },
    ];
    setData(mockData);

    const total = mockData.reduce((sum, i) => sum + i.revenue, 0);
    setSummary({ total });
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
    <Card className="shadow-md bg-white">
        <CardContent className="p-6">
        <h3 className="text-lg font-semibold">Tổng doanh thu</h3>
        <p className="text-3xl font-bold text-green-600">{summary.total.toLocaleString()} ₫</p>
        </CardContent>
    </Card>

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

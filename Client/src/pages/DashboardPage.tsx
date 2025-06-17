import React from 'react';
import { Link } from 'react-router-dom';

import { 
  BarChart2, 
  ChevronRight, 
  Download, 
  Package, 
  ShoppingBag, 
  TrendingUp } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { AnalyticsSummary, PredictionSummary } from '../types';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Mock data for analytics summary
  const analyticsSummary: AnalyticsSummary = {
    totalSales: 125000,
    totalPurchases: 85000,
    totalProfit: 40000,
    customerCount: 350,
    topSellingItems: [
      { name: 'Rice (5kg)', quantity: 150, revenue: 15000 },
      { name: 'Cooking Oil (1L)', quantity: 120, revenue: 12000 },
      { name: 'Wheat Flour (10kg)', quantity: 100, revenue: 10000 }
    ],
    recentTransactions: [
      { id: 't1', date: '2023-03-15', amount: 1200, type: 'credit', description: 'Sales' },
      { id: 't2', date: '2023-03-14', amount: 500, type: 'debit', description: 'Purchase' },
      { id: 't3', date: '2023-03-12', amount: 800, type: 'credit', description: 'Sales' }
    ]
  };
  
  // Mock data for prediction summary
  const predictionSummary: PredictionSummary = {
    salesForecast: 135000,
    growthRate: 8,
    inventoryRecommendations: [
      { item: 'Rice (5kg)', currentStock: 50, recommendedStock: 75 },
      { item: 'Cooking Oil (1L)', currentStock: 30, recommendedStock: 45 },
      { item: 'Wheat Flour (10kg)', currentStock: 25, recommendedStock: 40 }
    ],
    potentialSavings: 12000,
    seasonalTrends: [
      { season: 'Summer', performance: 'high', projectedChange: 15 },
      { season: 'Monsoon', performance: 'medium', projectedChange: 5 },
      { season: 'Winter', performance: 'high', projectedChange: 12 }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar /> 
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-800 to-emerald-600 text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center flex items-center justify-center">
            Dashboard
            </h1>
            
            <p className="text-xl text-center max-w-3xl mx-auto text-blue-100">
              Dive deep into your business performance metrics.
            </p>
            <p className="text-xl text-center mt-4">
              {user?.storeName || 'Your Store Name'}
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <div className='flex flex-col min-h-screen bg-gray-50'>
          {/* Analytics Overview */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-blue-800" />
                  Analytics Overview
                </CardTitle>
                <p className="text-gray-500 text-sm mt-1">Last 30 days performance</p>
              </div>
              <Link to="/analytics" className="w-full md:w-auto">
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                View Detailed Analytics
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-800">Total Sales</p>
                    <ShoppingBag className="h-5 w-5 text-blue-800" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">{formatCurrency(analyticsSummary.totalSales)}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-800">Total Profit</p>
                    <TrendingUp className="h-5 w-5 text-green-800" />
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">{formatCurrency(analyticsSummary.totalProfit)}</p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-amber-800">Inventory Value</p>
                    <Package className="h-5 w-5 text-amber-800" />
                  </div>
                  <p className="text-2xl font-bold text-amber-900 mt-2">{formatCurrency(analyticsSummary.totalPurchases)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Top Selling Items</h3>
                <div className="space-y-4">
                  {analyticsSummary.topSellingItems.map((item, index) => (                      <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 justify-between">
              <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                Export Report
              </Button>
              <p className="text-sm text-gray-500">Updated 3 hours ago</p>
            </CardFooter>
          </Card>

          {/* Predictive Analysis */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-emerald-600" />
                  Predictive Analysis
                </CardTitle>
                <p className="text-gray-500 text-sm mt-1">Next 30 days forecast</p>
              </div>
              <Link to="/predictions" className="w-full md:w-auto">
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                  View Predictive Analysis
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-emerald-800">Sales Forecast</p>
                    <TrendingUp className="h-5 w-5 text-emerald-800" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-900 mt-2">{formatCurrency(predictionSummary.salesForecast)}</p>
                  <p className="text-sm text-emerald-800 mt-1">
                    {predictionSummary.growthRate > 0 ? '+' : ''}{predictionSummary.growthRate}% from last month
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-purple-800">Best Performing Season</p>
                    <BarChart2 className="h-5 w-5 text-purple-800" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-2">Summer</p>
                  <p className="text-sm text-purple-800 mt-1">
                    +15% projected growth
                  </p>
                </div>
              </div>
                <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Inventory Recommendations</h3>
                <div className="space-y-4">
                  {predictionSummary.inventoryRecommendations.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{item.item}</p>
                        <p className="text-sm text-gray-500">Current: {item.currentStock} units</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Recommended: {item.recommendedStock}</p>
                        <p className="text-sm text-emerald-600">
                          +{item.recommendedStock - item.currentStock} units needed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <BarChart2 className="h-4 w-4 mr-1 text-blue-800" />
                Based on 2 years of historical data
              </div>
              <p className="text-sm text-gray-500">Last updated: Today</p>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
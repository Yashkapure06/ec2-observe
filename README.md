# EC2 Observability Prototype - Tracer Take-Home Assessment

A comprehensive cloud observability dashboard designed specifically for bioinformaticians and technical teams to monitor EC2 infrastructure, identify cost waste, and optimize resource utilization.

## 🎯 Project Overview

This prototype addresses the core challenge faced by research teams: **understanding which servers are being used, how efficiently they're operating, and how infrastructure costs map to scientific jobs or teams**. The goal is to simplify cloud infrastructure management through a purpose-built dashboard that makes EC2 server performance, usage, and cost data accessible and actionable.

## 🚀 Key Features

### 📊 EC2 Instance Utilization Table

- **Core Metrics**: CPU, RAM, GPU utilization with visual progress bars
- **Waste Detection**: Intelligent waste scoring algorithm (0-100 scale)
- **Visual Indicators**: Color-coded waste levels (Good/Warning/Critical)
- **Sorting & Filtering**: By instance type, region, utilization, waste score
- **Search Functionality**: Global search across all instance properties
- **State Management**: Running, stopped, terminated with color coding
- **Cost Information**: Per-hour cost and uptime tracking

### 💰 Cost Attribution Panel

- **Multi-Dimensional Views**: Region, Instance Type, Service breakdowns
- **Visualization Options**: Table, Bar Chart, and Pie Chart views
- **Toggleable Dimensions**: Switch between different cost attribution methods
- **Percentage Calculations**: Clear breakdown of total costs
- **Interactive Charts**: Hover tooltips with detailed information

### 📈 Live Cloud Cost Overview

- **KPI Cards**: Total monthly cost, daily burn rate, projected monthly spend
- **Cost Trend Chart**: 7-day cost visualization with anomaly detection
- **Anomaly Detection**: Z-score based cost spike identification with detailed analysis
- **Interactive Anomaly Details**: Click-to-expand anomaly analysis dialog
- **Visual Cues**: Alert badges, red markers, and reference lines for cost anomalies

### ⏱️ Server Utilization Timeline Graph

- **Time-Series Visualization**: CPU, RAM, GPU usage over configurable time periods
- **Multi-Period Support**: 1 hour, 24 hour, and 7-day time windows
- **Behavioral Analysis**: Automatic detection of idle and spiky behavior patterns
- **Instance-Specific Data**: Realistic mock data generated per EC2 instance
- **Visual Indicators**: Color-coded lines, reference markers for thresholds
- **Modal Interface**: Integrated with EC2 table for seamless timeline access

### 🔍 Custom Filtering Layer

- **Multi-Category Filters**: Region, Instance Type, State, Waste Level, Environment, Service
- **Smart Filter UI**: Collapsible categories with search functionality
- **Real-Time Application**: Filters apply instantly across all dashboard components
- **Filter State Management**: Persistent filters with localStorage integration
- **Visual Feedback**: Active filter chips, count indicators, filtered results display

## 🏗️ Technical Architecture

### Frontend Stack

- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS** with shadcn/ui component library (25+ components)
- **React Query (TanStack Query)** for efficient data fetching and caching
- **Zustand** for state management with persistence
- **Responsive design** with mobile-first approach

### Backend Integration

- **AWS SDK v3** integration for EC2, CloudWatch, and Cost Explorer
- **API Routes**: `/api/ec2`, `/api/costs`, `/api/metrics`, `/api/test-aws`
- **Intelligent Fallback System**: Seamless switch to realistic mock data when AWS calls fail
- **Error Handling**: Graceful fallback to mock data

### Core Algorithms

#### Waste Detection Algorithm

- **Multi-Factor Scoring**: CPU, RAM, GPU utilization + uptime + cost
- **Weighted Calculation**: 40% utilization, 30% uptime, 30% cost
- **Intelligent Thresholds**: Good (<40), Warning (40-70), Critical (>70)
- **Actionable Insights**: Specific reasons for waste scores

#### Anomaly Detection System

- **Z-Score Analysis**: Configurable threshold for cost spike detection
- **Visual Indicators**: Red scatter points, reference lines, emoji markers
- **Interactive Details**: Comprehensive anomaly analysis with trend classification
- **Pattern Recognition**: Spike, trending up, trending down classifications

## 🎨 Design Features

- **Dark/Light Mode**: Theme switching with system preference
- **Anomaly Detection**: Automatic cost spike identification
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Performance**: Optimized with React Query and code splitting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- AWS Account with appropriate permissions
- Local development environment

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ec2-observe

# Install dependencies
npm install

# Set up environment variables
cp  .env.local
# Edit .env.local with your AWS credentials
AWS_REGION=youregion
AWS_ACCESS_KEY_ID=youraccesskeyID
AWS_SECRET_ACCESS_KEY=yoursecretaccesskey

# Run development server
npm run dev
```

## 📊 Implementation Details

### Filter System Architecture

**State Management:**

```typescript
// Zustand store with persistence
interface FilterStore extends FilterState {
  toggleFilterVisibility: () => void;
  applyFilter: (categoryId: string, value: string) => void;
  removeFilter: (categoryId: string, value: string) => void;
  clearAllFilters: () => void;
  resetToDefaults: () => void;
}
```

**Filter Categories:**

- **Region**: us-east-1, us-west-2, eu-west-1, ap-southeast-1
- **Instance Type**: t3.micro, t3.small, t3.medium, t3.large, r5.xlarge, p3.2xlarge
- **State**: Running, Stopped, Terminated
- **Waste Level**: Good, Warning, Critical (calculated in real-time)
- **Environment**: Production, Staging, Development
- **Service**: Web Server, Database, ML Training, Monitoring

### Timeline Data Generation

**Instance-Specific Mock Patterns:**

```typescript
const getInstanceConfig = (instanceId: string, instanceName: string) => {
  if (instanceName.includes("web")) {
    return {
      baseLoad: { cpu: 0.3, ram: 0.4, gpu: 0.1 },
      peakMultiplier: 2.5,
      idleHours: [2, 3, 4, 5], // Early morning
    };
  }
  // Database, ML training, monitoring patterns...
};
```

### Waste Score Calculation

The waste score is calculated using a weighted multi-factor approach (0-100 scale, lower is better):

**1. Resource Utilization (40% weight)**

- **Very Low (<20%)**: +40 points
- **Low (20-50%)**: +20 points
- **Good (≥50%)**: +0 points

**2. Instance Uptime (30% weight)**

- **Long-running (>30 days)**: +30 points
- **Medium (7-30 days)**: +15 points
- **Short (<7 days)**: +0 points

**3. Cost Impact (30% weight)**

- **High (>$100/day)**: +30 points
- **Medium ($50-100/day)**: +15 points
- **Low (<$50/day)**: +0 points

**Waste Level Classification:**

- **Good**: Score 0-39 (optimal resource usage)
- **Warning**: Score 40-69 (moderate waste concerns)
- **Critical**: Score 70-100 (significant waste detected)

## 🎯 UX Design Decisions

### Information Density vs. Readability

- **Chosen**: Dense table layout with 8+ columns for comprehensive data display
- **Rationale**: Bioinformaticians need to scan multiple instances simultaneously
- **Tradeoff**: Dense layout may overwhelm new users but enables power users to process large datasets efficiently

### Visual Scanning Preference

- **Color-coded waste scoring**: Critical/Warning/Good provides instant visual identification
- **Progress bars**: Enable quick scanning of utilization metrics
- **Dark theme**: Reduces eye strain for prolonged monitoring sessions

### Context Preservation

- **Inline timeline modals**: Preserve dashboard context while providing detailed analysis
- **Modal approach**: Chosen over dedicated pages for workflow continuity
- **Reduced navigation complexity**: No need for breadcrumbs or back navigation

## 🔧 Technical Decisions

### Architecture Choices

- **Next.js 15**: Modern React features and excellent developer experience
- **shadcn/ui**: Consistent, accessible component library
- **React Query**: Efficient data fetching and caching
- **Tailwind CSS**: Rapid UI development and consistent design system

### AWS Integration Strategy

- **Fallback System**: Mock data when AWS calls fail for development
- **Real-time Metrics**: CloudWatch integration for current utilization data
- **Cost Explorer**: Real AWS cost data with mock fallbacks

### Performance Considerations

- **Lazy Loading**: Components load data independently
- **Caching**: React Query handles data caching and stale time management
- **Responsive Design**: Mobile-first approach with progressive enhancement

## 🎊 Summary

This EC2 observability prototype provides a comprehensive, production-ready solution for bioinformatics teams to monitor and optimize their AWS infrastructure. The dashboard successfully balances technical sophistication with usability, delivering immediate value through actionable cost insights while maintaining the performance and reliability required for production environments.

**Key Achievements:**

- ✅ Complete feature implementation meeting all assessment requirements
- ✅ Advanced waste detection algorithm with actionable insights
- ✅ Intelligent anomaly detection with detailed analysis
- ✅ Smart filtering system with real-time cross-component updates
- ✅ Responsive design with accessibility considerations
- ✅ Robust AWS integration with intelligent fallback systems



# Sơ đồ Component - Food Fast Delivery System

## 1. Kiến trúc Component theo Style UML (Như ảnh gửi)

```mermaid
graph TB
    subgraph "Main Flow - Core Business Logic"
        subgraph "Actors"
            Customer[Customer<br/>Đặt món / Thanh toán]
            Restaurant[Restaurant<br/>Quản lý menu / đơn hàng]
            Admin[Admin<br/>Theo dõi & điều hành hệ thống]
        end
        
        subgraph "Frontend Layer"
            Frontend[FrontEnd<br/>Web/Mobile App<br/>- Customer Interface<br/>- Restaurant Interface<br/>- Admin Interface]
        end
        
        subgraph "Gateway Layer"
            MyGateway[MyGateway]
            APIGateway[FFD API Gateway / Backend<br/>- Routing<br/>- Authentication<br/>- Load Balancing]
        end
        
        subgraph "Core Services"
            OrderService[Order Service<br/>OrderService<br/>- Tạo yêu cầu thanh toán<br/>- On log đơn hàng]
            
            subgraph "Restaurant Domain"
                DroneManager[Drone Management Service<br/>DroneManager<br/>- Quản lý drone<br/>- GPS tracking]
                RestaurantService[Restaurant Service<br/>RestaurantService<br/>- Quản lý nhà hàng<br/>- Menu management]
            end
            
            DeliveryService[Delivery Service<br/>DeliveryService<br/>- Giao hàng<br/>- Route optimization]
            
            GPSCache[Redis GPS Cache<br/>GpsCache<br/>- On log GPS<br/>- Real-time tracking]
        end
        
        subgraph "Real-time Communication"
            WebSocket[WebSocket / STOMP<br/>Realtime<br/>- Real-time updates<br/>- Notifications]
        end
    end
    
    subgraph "Payment Service - Dedicated Payment Processing"
        PaymentService[Payment Service<br/>PaymentGateway<br/>PaymentService<br/>- MoMo Payment<br/>- QR Code<br/>- App-to-App<br/>- IPN Handling]
    end
    
    subgraph "Application Data Management - Logging & Reporting"
        AdminDashboard[Admin Dashboard FE<br/>Reporting<br/>- Analytics<br/>- Reports<br/>- Monitoring]
        
        DataPipeline[Data Pipeline<br/>Logging<br/>DataStorage<br/>- Collect logs<br/>- Process data<br/>- Store metrics]
        
        MongoDB[(MongoDB / Redis<br/>Data Storage<br/>- User data<br/>- Order data<br/>- Drone data<br/>- Cache)]
    end
    
    %% Actor connections
    Customer --> Frontend
    Restaurant --> Frontend
    Admin --> Frontend
    
    %% Frontend to Gateway
    Frontend --> MyGateway
    MyGateway --> APIGateway
    
    %% Gateway to Core Services
    APIGateway --> OrderService
    APIGateway --> DroneManager
    APIGateway --> RestaurantService
    APIGateway --> DeliveryService
    APIGateway --> GPSCache
    APIGateway --> WebSocket
    
    %% Core Service interactions
    OrderService --> PaymentService
    OrderService --> DataPipeline
    DeliveryService --> DataPipeline
    GPSCache --> DataPipeline
    APIGateway --> DataPipeline
    
    %% Payment Service interactions
    PaymentService --> OrderService
    
    %% Data Management interactions
    DataPipeline --> MongoDB
    AdminDashboard --> DataPipeline
    
    %% Real-time connections
    WebSocket --> Frontend
    
    %% External connections (implicit)
    PaymentService -.-> MoMoGateway[MoMo Payment Gateway]
    Frontend -.-> Cloudinary[Cloudinary Storage]
```

## 2. Chi tiết các Component và Interface

### Main Flow (Core Business Logic)
- **Customer**: Actor tương tác để "Đặt món / Thanh toán"
- **Restaurant**: Actor tương tác để "Quản lý menu / đơn hàng"  
- **Admin**: Actor tương tác để "Theo dõi & điều hành hệ thống"
- **FrontEnd**: Giao diện web/mobile cho tất cả 3 loại người dùng
- **MyGateway**: Interface kết nối FrontEnd với API Gateway
- **FFD API Gateway / Backend**: Điểm vào trung tâm cho tất cả services
- **Order Service**: Xử lý đơn hàng, tạo yêu cầu thanh toán, cập nhật trạng thái
- **Restaurant Domain**: 
  - **Drone Management Service**: Quản lý drone với interface "DroneManager"
  - **Restaurant Service**: Quản lý nhà hàng với interface "RestaurantService"
- **Delivery Service**: Xử lý giao hàng với interface "DeliveryService"
- **Redis GPS Cache**: Cache GPS với interface "GpsCache", có kết nối "On log GPS"
- **WebSocket / STOMP**: Giao tiếp real-time với interface "Realtime"

### Payment Service (Dedicated Payment Processing)
- **Payment Service**: Xử lý thanh toán với 2 interfaces:
  - **PaymentGateway**: Nhận yêu cầu từ API Gateway
  - **PaymentService**: Nhận yêu cầu từ Order Service ("Tạo yêu cầu thanh toán") và gửi cập nhật ("Cập nhật trạng thái đơn hàng")

### Application Data Management (Logging & Reporting)
- **Admin Dashboard FE**: Giao diện admin với interface "Reporting"
- **Data Pipeline**: Xử lý dữ liệu với 2 interfaces:
  - **Logging**: Nhận logs từ API Gateway, Order Service, Delivery Service, Redis GPS Cache
  - **DataStorage**: Lưu trữ dữ liệu vào MongoDB/Redis
- **MongoDB / Redis**: Lưu trữ dữ liệu chính

## 3. Kiến trúc Monolith (Backup/Legacy)

```mermaid
graph TB
    subgraph "Frontend Layer"
        Client[React Client<br/>Port: 5173<br/>- Customer Interface<br/>- Restaurant Interface<br/>- Admin Interface]
    end
    
    subgraph "Backend Layer"
        Server[Express Server<br/>Port: 5000<br/>- REST API<br/>- Authentication<br/>- Business Logic]
        
        subgraph "Controllers"
            AuthCtrl[Auth Controller]
            UserCtrl[User Controller]
            RestaurantCtrl[Restaurant Controller]
            OrderCtrl[Order Controller]
            DroneCtrl[Drone Controller]
            PaymentCtrl[Payment Controller]
            AdminCtrl[Admin Controller]
        end
        
        subgraph "Services"
            PaymentMomo[MoMo Payment Service]
        end
        
        subgraph "Models"
            UserModel[User Model]
            RestaurantModel[Restaurant Model]
            MenuModel[MenuItem Model]
            OrderModel[Order Model]
            DroneModel[Drone Model]
            MissionModel[DeliveryMission Model]
        end
        
        subgraph "Middleware"
            AuthMW[Authentication Middleware]
            ValidationMW[Validation Middleware]
            ErrorMW[Error Handler]
        end
    end
    
    subgraph "Database Layer"
        MongoDB[(MongoDB<br/>Single Database)]
    end
    
    subgraph "Real-time Communication"
        SocketIO[Socket.IO<br/>Real-time Updates]
    end
    
    subgraph "External Services"
        MoMo[MoMo Payment Gateway]
        Cloudinary[Cloudinary<br/>Image Storage]
    end
    
    %% Frontend connections
    Client --> Server
    Client --> SocketIO
    
    %% Server internal connections
    Server --> AuthCtrl
    Server --> UserCtrl
    Server --> RestaurantCtrl
    Server --> OrderCtrl
    Server --> DroneCtrl
    Server --> PaymentCtrl
    Server --> AdminCtrl
    
    %% Controller to Model connections
    AuthCtrl --> UserModel
    UserCtrl --> UserModel
    RestaurantCtrl --> RestaurantModel
    RestaurantCtrl --> MenuModel
    OrderCtrl --> OrderModel
    DroneCtrl --> DroneModel
    DroneCtrl --> MissionModel
    PaymentCtrl --> PaymentMomo
    
    %% Model to Database connections
    UserModel --> MongoDB
    RestaurantModel --> MongoDB
    MenuModel --> MongoDB
    OrderModel --> MongoDB
    DroneModel --> MongoDB
    MissionModel --> MongoDB
    
    %% External service connections
    PaymentMomo --> MoMo
    Client --> Cloudinary
    
    %% Middleware connections
    Server --> AuthMW
    Server --> ValidationMW
    Server --> ErrorMW
```

## 3. Component Interaction Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant G as API Gateway
    participant A as Auth Service
    participant R as Restaurant Service
    participant O as Order Service
    participant D as Drone Service
    participant P as Payment Service
    participant N as Notification Service
    
    C->>F: Đăng nhập
    F->>G: POST /api/auth/login
    G->>A: Forward login request
    A-->>G: JWT Token
    G-->>F: Token response
    F-->>C: Đăng nhập thành công
    
    C->>F: Đặt món
    F->>G: POST /api/orders
    G->>O: Create order
    O->>R: Validate restaurant
    O->>D: Assign drone
    O->>P: Create payment
    O->>N: Send notification
    O-->>G: Order created
    G-->>F: Order response
    F-->>C: Đặt món thành công
    
    C->>F: Thanh toán
    F->>G: POST /api/payments/process
    G->>P: Process payment
    P->>MoMo: Payment request
    MoMo-->>P: Payment result
    P->>O: Update order status
    P->>N: Send payment notification
    P-->>G: Payment response
    G-->>F: Payment result
    F-->>C: Thanh toán thành công
    
    D->>N: Drone location update
    N->>F: Socket.IO event
    F-->>C: Real-time tracking
```

## 4. Database Schema Overview

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ Restaurant : owns
    User ||--o{ Drone : manages
    
    Restaurant ||--o{ MenuItem : contains
    Restaurant ||--o{ Order : receives
    Restaurant ||--o{ Drone : operates
    
    Order ||--|| DeliveryMission : has
    Order ||--|| Payment : includes
    
    Drone ||--o{ DeliveryMission : executes
    
    User {
        string id PK
        string email
        string password
        string role
        string name
        string phone
        string address
        datetime createdAt
        datetime updatedAt
    }
    
    Restaurant {
        string id PK
        string name
        string description
        string address
        array coordinates
        string ownerId FK
        string status
        datetime createdAt
        datetime updatedAt
    }
    
    MenuItem {
        string id PK
        string name
        string description
        number price
        string image
        string restaurantId FK
        boolean available
        datetime createdAt
        datetime updatedAt
    }
    
    Order {
        string id PK
        string customerId FK
        string restaurantId FK
        array items
        number totalAmount
        string status
        string paymentStatus
        datetime createdAt
        datetime updatedAt
    }
    
    Drone {
        string id PK
        string name
        string restaurantId FK
        string status
        number battery
        number payload
        number range
        array currentLocation
        datetime lastMaintenance
        datetime createdAt
        datetime updatedAt
    }
    
    DeliveryMission {
        string id PK
        string orderId FK
        string droneId FK
        string status
        array route
        datetime startTime
        datetime endTime
        datetime createdAt
        datetime updatedAt
    }
    
    Payment {
        string id PK
        string orderId FK
        string method
        number amount
        string status
        string transactionId
        datetime createdAt
        datetime updatedAt
    }
```

## 5. Technology Stack

### Frontend
- **React 18** + **Vite** - UI Framework
- **TailwindCSS** - Styling
- **Zustand** - State Management
- **Socket.IO Client** - Real-time Communication
- **Axios** - HTTP Client

### Backend (Microservices)
- **Node.js** + **Express** - API Framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **Socket.IO** - Real-time Communication
- **Winston** - Logging

### Backend (Monolith)
- **Node.js** + **Express** - API Framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **Socket.IO** - Real-time Communication
- **MoMo Payment Gateway** - Payment Processing

### External Services
- **MoMo E-Wallet** - Payment Gateway
- **Cloudinary** - Image Storage
- **MongoDB Atlas** - Database Hosting

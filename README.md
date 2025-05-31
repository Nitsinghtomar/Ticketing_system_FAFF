# FAFF v0 - Internal Ticketing & Chat Assignment System

A minimal but polished internal ticketing interface where operations teams can view & manage tasks, participate in threaded group chats, and leverage AI-powered summarization and quality assurance.

## 🚀 Live Demo
Click on this link :``` https://faff-v0-client.onrender.com```
#Note
The AI tasks such as AI summary and QA reviews might not work in the LIVE DEMO due to AI-key issues or CORS issues.

## VIdeo Showing how to use the application (Refer this if above Live Demo does not work)
```
https://www.loom.com/share/14220059776e40799aae014aad3b2a2f?sid=1e915d23-1693-4fdf-ab63-ebfa0e59a9b8
```
> **Note**: Backend may take 30-60 seconds to wake up on first load (Render free tier)

## Directory Structure
```bash
faff-v0
├── Readme.md
├── client
│   ├── build
│   │   └── sw.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── components
│   │   │   ├── ChatPane
│   │   │   │   ├── ChatPane.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   ├── MessageThread.tsx
│   │   │   │   └── SummaryPanel.tsx
│   │   │   ├── EnhancedControls.tsx
│   │   │   ├── EnhancedSummary.tsx
│   │   │   ├── QualityAssurance
│   │   │   │   └── EnhancedQAReviewPanel.tsx
│   │   │   ├── ResizablePanel.tsx
│   │   │   ├── Search
│   │   │   ├── SimpleQAPanel.tsx
│   │   │   ├── StatusControls
│   │   │   │   └── StatusDropdown.tsx
│   │   │   ├── TaskList
│   │   │   │   ├── TaskFilters.tsx
│   │   │   │   ├── TaskItem.tsx
│   │   │   │   └── TaskList.tsx
│   │   │   └── common
│   │   │       └── Layout.tsx
│   │   ├── contexts
│   │   │   └── SocketContext.tsx
│   │   ├── hooks
│   │   ├── index.css
│   │   ├── index.tsx
│   │   ├── react-app-env.d.ts
│   │   ├── services
│   │   │   └── api.ts
│   │   └── types
│   │       ├── Message.ts
│   │       └── Task.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── tsconfig.node.json
├── package-lock.json
├── package.json
├── scripts
│   ├── deploy.sh
│   └── setup.js
└── server
    ├── database.sqlite
    ├── dist
    │   ├── app.d.ts
    │   ├── app.js
    │   ├── app.js.map
    │   ├── controllers
    │   │   ├── chatController.d.ts
    │   │   ├── chatController.js
    │   │   ├── chatController.js.map
    │   │   ├── qaController.d.ts
    │   │   ├── qaController.js
    │   │   ├── qaController.js.map
    │   │   ├── summaryController.d.ts
    │   │   ├── summaryController.js
    │   │   ├── summaryController.js.map
    │   │   ├── taskController.d.ts
    │   │   ├── taskController.js
    │   │   └── taskController.js.map
    │   ├── database
    │   │   ├── connection.d.ts
    │   │   ├── connection.js
    │   │   ├── connection.js.map
    │   │   ├── migrations
    │   │   │   ├── 001_create_tasks_table.d.ts
    │   │   │   ├── 001_create_tasks_table.js
    │   │   │   ├── 001_create_tasks_table.js.map
    │   │   │   ├── 002_create_messages_table.d.ts
    │   │   │   ├── 002_create_messages_table.js
    │   │   │   ├── 002_create_messages_table.js.map
    │   │   │   ├── 003_create_summaries_table.d.ts
    │   │   │   ├── 003_create_summaries_table.js
    │   │   │   ├── 003_create_summaries_table.js.map
    │   │   │   ├── 004_create_qa_reviews_table.d.ts
    │   │   │   ├── 004_create_qa_reviews_table.js
    │   │   │   ├── 004_create_qa_reviews_table.js.map
    │   │   │   ├── 005_create_users_table.d.ts
    │   │   │   ├── 005_create_users_table.js
    │   │   │   └── 005_create_users_table.js.map
    │   │   └── seeds
    │   │       ├── 001_sample_data.cjs
    │   │       ├── 001_sample_data.d.ts
    │   │       ├── 001_sample_data.js
    │   │       └── 001_sample_data.js.map
    │   ├── middleware
    │   │   ├── errorHandler.d.ts
    │   │   ├── errorHandler.js
    │   │   └── errorHandler.js.map
    │   ├── models
    │   │   ├── Message.d.ts
    │   │   ├── Message.js
    │   │   ├── Message.js.map
    │   │   ├── Task.d.ts
    │   │   ├── Task.js
    │   │   └── Task.js.map
    │   ├── routes
    │   │   ├── chat.d.ts
    │   │   ├── chat.js
    │   │   ├── chat.js.map
    │   │   ├── qa.d.ts
    │   │   ├── qa.js
    │   │   ├── qa.js.map
    │   │   ├── summary.d.ts
    │   │   ├── summary.js
    │   │   ├── summary.js.map
    │   │   ├── tasks.d.ts
    │   │   ├── tasks.js
    │   │   ├── tasks.js.map
    │   │   ├── upload.d.ts
    │   │   ├── upload.js
    │   │   └── upload.js.map
    │   ├── server.d.ts
    │   ├── server.js
    │   ├── server.js.map
    │   ├── services
    │   │   ├── anthropicService.d.ts
    │   │   ├── anthropicService.js
    │   │   ├── anthropicService.js.map
    │   │   ├── qaService.d.ts
    │   │   ├── qaService.js
    │   │   └── qaService.js.map
    │   ├── socket
    │   │   ├── socketHandlers.d.ts
    │   │   ├── socketHandlers.js
    │   │   └── socketHandlers.js.map
    │   ├── storage
    │   │   ├── messageStorage.d.ts
    │   │   ├── messageStorage.js
    │   │   └── messageStorage.js.map
    │   └── utils
    │       ├── logger.d.ts
    │       ├── logger.js
    │       └── logger.js.map
    ├── knexfile.js
    ├── logs
    │   ├── combined.log
    │   └── error.log
    ├── nodemon.json
    ├── package-lock.json
    ├── package.json
    ├── seed.js
    ├── src
    │   ├── app.ts
    │   ├── controllers
    │   │   ├── chatController.ts
    │   │   ├── qaController.ts
    │   │   ├── summaryController.ts
    │   │   └── taskController.ts
    │   ├── database
    │   │   ├── connection.ts
    │   │   ├── migrations
    │   │   │   ├── 001_create_tasks_table.ts
    │   │   │   ├── 002_create_messages_table.ts
    │   │   │   ├── 003_create_summaries_table.ts
    │   │   │   ├── 004_create_qa_reviews_table.ts
    │   │   │   └── 005_create_users_table.ts
    │   │   ├── seedData.ts
    │   │   └── seeds
    │   │       └── 001_sample_data.ts
    │   ├── middleware
    │   │   └── errorHandler.ts
    │   ├── models
    │   │   ├── Message.ts
    │   │   └── Task.ts
    │   ├── routes
    │   │   ├── chat.ts
    │   │   ├── qa.ts
    │   │   ├── summary.ts
    │   │   ├── tasks.ts
    │   │   └── upload.ts
    │   ├── server.ts
    │   ├── services
    │   │   ├── anthropicService.ts
    │   │   └── qaService.ts
    │   ├── socket
    │   │   └── socketHandlers.ts
    │   ├── storage
    │   │   └── messageStorage.ts
    │   └── utils
    │       └── logger.ts
    ├── tsconfig.json
    └── uploads
    
  ```


## 📋 Features Overview

### ✅ **1. Task List View [30%]** - COMPLETE
- **Vertical list** displaying all ticket details (requester, date, title, assignee, status, tags)
- **Real-time updates** via Socket.io when tasks are created/modified
- **Clean, scrollable layout** with priority-based visual indicators
- **Basic filtering** by status, priority, and search terms
- **Standard DOM rendering** (currently handles ~50 tasks efficiently)

### ✅ **2. Expandable Chat Pane [40%]** - COMPLETE
- **In-place expansion** when clicking any task
- **Basic message threading** with sender identification
- **Rich media support** for images and documents (PDF, Word, Excel, etc.)
- **Real-time message delivery** via Socket.io
- **File upload/download** with preview capabilities
- **QA trigger system** using @QAreview in messages

### ✅ **3. Status & Assignment Controls [20%]** - COMPLETE
- **Dropdown status controls** with immediate visual feedback
- **Team member assignment system** with unassign capability
- **Real-time status updates** across all connected users
- **Basic audit trail** through updated timestamps

### ✅ **4. Discussion Summarization [10%]** - COMPLETE
- **AI-powered summarization** using Anthropic's Claude API
- **Entity extraction** (phone numbers, emails, links, dates)
- **Contextual summaries** that include task status and participants
- **In-memory caching** for the current session
- **Manual generation** with scroll position preservation

### ✅ **5. Quality Assurance [BONUS]** - COMPLETE
- **@QAreview trigger system** for message quality assessment
- **6 configurable QA rules**:
  - Formatting consistency (25% weight)
  - Information organization (20% weight)
  - Content completeness (20% weight)
  - Clarity and conciseness (15% weight)
  - Link consistency (10% weight)
  - Professional tone (10% weight)
- **Link validation service** that checks URL accessibility
- **Real-time QA scoring** (1-10 scale) with detailed feedback
- **Statistics dashboard** showing approval rates and trends

## 🏗️ Current Architecture & Limitations

### **Current Implementation**
- **Frontend**: React with standard DOM rendering
- **Backend**: Node.js/Express with in-memory data storage
- **Database**: SQLite with simple table structures
- **Real-time**: Socket.io for basic event broadcasting
- **AI**: Direct Anthropic API calls without optimization
- **File Storage**: Local file system storage
- **Caching**: Basic React Query for API responses

### **Current Scale Support**
- **Tasks**: Efficiently handles ~50-100 tasks
- **Concurrent Users**: Tested with 5-10 simultaneous users
- **Messages**: No pagination, loads all messages for a task
- **Files**: Local storage, no size management
- **Database**: Single SQLite file, no indexing optimization

## 📈 Scaling to 10k+ Tasks

### **Database & Backend Optimizations Needed**

**Database Migration**:
- Migrate from SQLite to PostgreSQL for better concurrent access
- Add database indexes on frequently queried columns (status, priority, created_at, assigned_to)
- Implement database connection pooling
- Add read replicas for query optimization

**API Optimizations**:
- Implement cursor-based pagination for task list (currently loads all tasks)
- Add database query optimization with proper WHERE clauses and LIMIT/OFFSET
- Implement response caching with Redis for frequently accessed data
- Add API rate limiting and request queuing for high load

**Data Architecture**:
- Separate tables for tasks, messages, users, and audit logs
- Implement soft deletes for data retention
- Add database migrations system for schema changes
- Implement backup and recovery procedures

### **Frontend Performance Enhancements Needed**

**Virtual Scrolling Implementation**:
- Replace standard list rendering with react-window or react-virtualized
- Only render visible tasks in viewport (currently renders all tasks)
- Implement infinite scroll with progressive loading
- Add skeleton loading states for better perceived performance

**State Management Optimization**:
- Implement proper pagination state management
- Add optimistic updates for immediate UI feedback
- Use React.memo and useMemo extensively to prevent unnecessary re-renders
- Implement component lazy loading for better initial load times

**Caching Strategy**:
- Implement service worker for offline functionality
- Add browser storage for recently viewed tasks
- Implement smart prefetching for likely-to-be-viewed tasks
- Use React Query infinite queries for seamless pagination

### **Real-time Architecture Scaling**

**Socket.io Optimization**:
- Implement Socket.io rooms for task-specific broadcasts (currently broadcasts to all users)
- Add connection management for handling disconnections and reconnections
- Implement message queuing for offline users
- Add horizontal scaling with Redis adapter for multiple server instances

**Event Optimization**:
- Batch similar events to reduce network overhead
- Implement event compression for large payloads
- Add selective event subscriptions (users only get events for tasks they care about)
- Implement graceful degradation when WebSocket fails

## 🤖 Current AI Implementation & Enhancement Path

### **Current AI Capabilities**
- **Summarization**: Direct Claude API calls with basic prompts
- **Entity Extraction**: Simple regex-based extraction for phones, emails, URLs
- **QA Analysis**: 6 hardcoded rules with basic scoring algorithm
- **Link Validation**: Simple HTTP HEAD requests to check URL validity
- **Error Handling**: Basic try-catch with fallback responses

### **AI Framework Enhancement for Scale**

**Request Optimization**:
- Implement request batching to reduce API calls
- Add intelligent caching of AI responses (similar summaries, repeated QA patterns)
- Implement background processing queue for non-urgent AI tasks
- Add rate limiting and retry logic with exponential backoff

**Framework Modularity**:
- Create pluggable rule system where new QA rules can be added via configuration files
- Implement A/B testing framework for different AI prompts and models
- Add rule weighting system that can be adjusted without code changes
- Create template system for different types of summaries (technical vs. business)

**Advanced AI Features** (Future Extensions):
- Sentiment analysis for escalation detection
- Auto-tagging based on message content
- Smart routing suggestions based on task content and team expertise
- Predictive analytics for task completion times

**Performance & Cost Optimization**:
- Implement prompt engineering optimization to reduce token usage
- Add streaming responses for faster perceived performance
- Create fallback mechanisms when AI services are unavailable
- Implement cost monitoring and usage analytics

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for API state management
- **Socket.io Client** for real-time updates
- **React Hot Toast** for notifications
- **Axios** for HTTP requests

### **Backend**
- **Node.js** with Express and TypeScript
- **Socket.io** for WebSocket communication
- **SQLite** with Knex.js query builder
- **Anthropic Claude API** for AI features
- **Multer** for file uploads
- **Winston** for logging

### **Development & Deployment**
- **Vercel** for frontend hosting
- **Render** for backend hosting
- **GitHub** for version control
- **npm** for package management

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### **Installation**

```bash
# Clone the repository
git clone https://github.com/yourusername/faff-v0.git
cd faff-v0

# Install dependencies
npm run setup

# Add your API key to server/.env
echo "ANTHROPIC_API_KEY=your_key_here" >> server/.env
```

### **Development**

```bash
# Start both client and server
npm run dev

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## 📱 User Guide

### **1. Managing Tasks**

**Creating Tasks**:
1. Click "New Task" button in task list header
2. Fill required fields (title, requester name)
3. Optionally set priority and assign team member
4. Tasks appear immediately in the list

**Viewing & Filtering**:
- Search by task title or requester name
- Filter by status (Logged, Ongoing, Reviewed, Done, Blocked)
- Filter by priority (Low, Medium, High, Urgent)
- Real-time updates show new tasks automatically

**Status & Assignment Management**:
- Use dropdown menus to change status or assignment
- Changes apply immediately with visual feedback
- All connected users see updates in real-time
- Unassign tasks using the "Unassign" option

### **2. Chat & Communication**

**Starting Conversations**:
1. Click any task to open chat panel
2. Chat panel appears on the right side
3. Type messages in the input field at bottom
4. Messages appear instantly for all viewers

**File Sharing**:
- Click paperclip icon to attach files
- Supported: Images (JPG, PNG, GIF, WebP), Documents (PDF, Word, Excel, TXT, CSV)
- Maximum 10MB per file
- Files are downloadable by all users

**Quality Assurance**:
- Type `@QAreview` in any message to trigger quality analysis
- QA results appear automatically with scores and feedback
- Access QA dashboard using "Show QA" button

### **3. AI Features**

**Smart Summarization**:
1. Click "Show Summary" in chat header
2. Click "Generate Summary" button
3. AI analyzes entire conversation and extracts:
   - Key discussion points and decisions
   - Contact information (phone numbers, emails)
   - Important links and documents
   - Current task status and next steps

**Quality Assurance Dashboard**:
- **Reviews Tab**: View all QA assessments with detailed scores
- **Stats Tab**: See approval rates, average scores, and trends
- **Rules Tab**: View active QA criteria and their weights
- Real-time updates as new QA reviews are completed

## 🔧 Configuration

### **Environment Variables**

**Server (.env)**:
```bash
PORT=5000
NODE_ENV=development
DATABASE_URL=sqlite:./database.sqlite
ANTHROPIC_API_KEY=your_api_key_here
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_jwt_secret
QA_ENABLED=true
LINK_VALIDATION_ENABLED=true
LOG_LEVEL=info
```

**Client (.env)**:
```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

## 🧪 Testing

### **Manual Testing Workflow**
1. Create test tasks with realistic content
2. Add messages with different content types
3. Upload various file formats
4. Test `@QAreview` functionality
5. Generate AI summaries and verify entity extraction
6. Test real-time updates with multiple browser windows
7. Verify status and assignment changes work correctly

### **Current Limitations to Test**
- Performance degrades with 100+ tasks in list
- No message pagination (all messages load at once)
- File storage is local only
- No offline functionality
- Limited to single server instance

## 🚀 Deployment

### **Frontend (Vercel)**
```bash
cd client
npm run build
npx vercel --prod
```

### **Backend (Render)**
1. Connect GitHub repository to Render
2. Set build command: `cd server && npm install && npm run build`
3. Set start command: `cd server && npm start`
4. Add environment variables in Render dashboard

## 🔮 Future Enhancement Roadmap

### **Performance Improvements**
1. **Implement virtual scrolling** for task list to handle 1000+ tasks
2. **Add message pagination** to prevent loading all messages at once
3. **Implement database indexing** for faster query responses
4. **Add request debouncing** for search and filter operations

### **Scalability Enhancements**
1. **Migrate to PostgreSQL** with proper connection pooling
2. **Implement Redis caching** for frequently accessed data
3. **Add horizontal scaling** support with load balancers
4. **Implement proper error handling** and retry mechanisms

### **User Experience Improvements**
1. **Add offline support** with service workers
2. **Implement push notifications** for important updates
3. **Add dark mode** and accessibility improvements
4. **Create mobile-responsive design** for tablet/phone use

### **AI & QA Enhancements**
1. **Add batch processing** for AI operations
2. **Implement smart caching** for similar AI requests
3. **Create configurable QA rules** via admin interface
4. **Add sentiment analysis** for escalation detection



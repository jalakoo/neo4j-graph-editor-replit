# Neo4j Graph Editor

An interactive graph editing and visualization application that enables users to create, manipulate, and analyze complex network relationships through Neo4j integration.

## Features

- Interactive graph visualization using Cytoscape.js
- Create and edit nodes and relationships
- Real-time Neo4j database synchronization
- Permanent right-hand details panel with editable properties
- Undo/Redo functionality
- Save and load graph data from Neo4j

## Prerequisites

Before running the application, ensure you have:

- [Node.js](https://nodejs.org/) (v18 or later)
- [Neo4j Database](https://neo4j.com/download/) (v4.4 or later)
  - A running Neo4j instance with connection details

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd neo4j-graph-editor
```

2. Install dependencies:
```bash
npm install
```

## Configuration

1. Start your Neo4j database instance

2. Have your Neo4j connection details ready:
   - Database URL (e.g., `neo4j://localhost:7687`)
   - Username (default: `neo4j`)
   - Password (set during Neo4j installation)

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Click the "Connect to Database" button in the top-right corner and enter your Neo4j connection details

## Usage

### Graph Manipulation
- Click the "+" button to add a new node
- Click the link icon to add a new relationship between nodes
- Select nodes/relationships and use the delete button to remove them
- Double-click nodes or relationships to edit their labels

### Properties
- Select any node or relationship to view its properties in the right panel
- Click the edit icon next to any property to modify its value
- Changes are automatically synchronized with the Neo4j database

### History
- Use the undo/redo buttons to navigate through your changes
- The history tracks all modifications to the graph

## Development

- Frontend: React + TypeScript
- Graph Visualization: Cytoscape.js
- Database: Neo4j
- State Management: Zustand
- UI Components: shadcn/ui

## License

MIT

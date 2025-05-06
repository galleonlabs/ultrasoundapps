# UltrasoundApps Homepage

A simple, customizable homepage for crypto app users to easily access their favorite tools.

## Features

- **No Authentication Required**: Access all features without logging in
- **Firestore Integration**: Default tools list loaded from Firebase
- **Local Customization**: Extend your tools list with custom entries
- **Import/Export**: Save and share your custom layouts
- **Responsive Design**: Optimized for desktop and mobile
- **Dark/Light Theme**: Toggle between visual modes
- **Drag and Drop**: Reorder tools with intuitive drag and drop
- **Categories**: Group tools by category for better organization
- **Search**: Find tools quickly with smart search functionality
- **Caching**: Optimized data loading with cache fallbacks
- **Offline Support**: Works even without internet connection

## Technology Stack

- **React** with **TypeScript**
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **Firebase** (Firestore) for backend storage
- **@dnd-kit** for drag and drop functionality
- **heroicons** for UI icons
- **React Context API** for state management

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Deploy to Firebase
npm run deploy
```

## Project Structure

- `src/Components/`: React components
  - `ToolsList.tsx`: Main component for displaying the list of tools
  - `ToolItem.tsx`: Individual tool display card
  - `DraggableToolsList.tsx`: Drag and drop wrapper for tool lists
  - `SortableToolItem.tsx`: Sortable version of tool item for drag context
  - `ToolControls.tsx`: UI for editing tools list
- `src/context/`: Context providers
  - `ThemeContext.tsx`: Dark/light theme management
- `src/layout/`: Layout components
  - `Layout.tsx`: Main application layout
- `firebase.config.ts`: Firebase configuration
- `public/`: Static assets

## Recent Updates

- **Fixed Drag and Drop**: Resolved issue with items reverting to original positions
- **Removed Mock Data**: Ensured app only uses real data from Firebase or localStorage
- **Loading State Fix**: Corrected issue with loading screen getting stuck
- **Mobile Optimization**: Enhanced mobile UI for better touch interaction
- **Performance Improvements**: Optimized state management for smoother experience

## Storage and Caching

- **Firebase**: Source of truth for default tools list
- **localStorage**: Stores user customizations:
  - Custom tools
  - Visibility settings
  - Favorites
  - Custom categories
  - Saved layouts
  - Cache for Firestore data (30 minute validity)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin my-feature`
5. Submit a pull request
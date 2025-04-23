# Project Setup

## Installation Instructions

Follow these steps to get the project up and running:

1. Clone the GitHub repository  
   git clone https://github.com/your-username/your-repo-name.git  
   cd your-repo-name

2. Install required packages  
   npm install

3. Ensure React Native and Convex CLI are installed  
   - React Native Documentation: https://reactnative.dev/docs/environment-setup  
   - Install Convex CLI globally:  
     npm install -g convex

4. Add a .env file  
   Create a .env file in the root directory of your project and include the necessary Clerk and Convex keys:  
   CLERK_PUBLISHABLE_KEY=your-clerk-key  
   CONVEX_DEPLOYMENT_URL=your-convex-url

5. Run the project  
   Start the project with Expo:  
   npx expo start

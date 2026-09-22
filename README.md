\# Trackzio Movie Discovery App



This is a full-stack movie and TV show discovery app that I built as part of the Trackzio Full-Stack Developer Intern assignment.



The main idea of the project is to let users search for shows, explore more shows, apply filters, sort results, view details, and save their favourite shows to a wishlist.



\## What can you do with the app?



\* Search for a movie or TV show

\* Browse shows without searching

\* Load more shows as you continue exploring

\* Filter shows by genre, status, language, and rating

\* Sort results by rating, release date, or title

\* Open a show to see more details

\* Add shows to a wishlist

\* Remove shows from the wishlist

\* Keep the wishlist even after refreshing or reopening the browser

\* See loading messages while data is being fetched

\* Get useful messages when there are no results or something goes wrong

\* Use the app on desktop, tablet, or mobile



\## Technologies Used



\### Frontend



\* React

\* Vite

\* JavaScript

\* CSS

\* LocalStorage



\### Backend



\* Node.js

\* Express.js

\* Axios

\* CORS



\### API



I used the TVMaze API to get the show data.



The React frontend does not directly call TVMaze. Instead, it sends requests to my Node.js backend, and the backend communicates with TVMaze.



\## How the project works



The basic flow is:



```text

React Frontend

&#x20;     ↓

Node.js / Express Backend

&#x20;     ↓

movieService.js

&#x20;     ↓

TVMaze API

```



I kept the TVMaze API calls inside the backend so that the frontend does not depend directly on the external API structure.



The backend also converts the API response into the format needed by the frontend.



\## Project Structure



```text

trackzio-movie-app/

│

├── backend/

│   ├── services/

│   │   └── movieService.js

│   ├── server.js

│   ├── package.json

│   └── .env

│

├── frontend/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── App.css

│   │   └── ...

│   └── package.json

│

├── .gitignore

└── README.md

```



\## Main API Routes



\### Check backend



```text

GET /

```



This is used to check whether the backend is running.



\### Search



```text

GET /api/movies?search=batman

```



This searches for shows based on the user's search text.



\### Browse



```text

GET /api/movies/browse?page=0

```



This gets a page of shows for the Browse Shows section.



When the user clicks \*\*Load More Shows\*\*, the next page is requested.



\### Show Details



```text

GET /api/movies/:id

```



This gets the details of a selected show.



\## Wishlist



I used browser `localStorage` for the wishlist.



The wishlist is saved using:



```text

trackzio-wishlist

```



I chose localStorage because the assignment requires the wishlist to remain available after closing and reopening the application.



For this assignment, a database was not necessary because there is no login or user account system.



If this were a production application, I would store wishlist data in a database so that users could access it from different devices.



\## Search and Request Handling



I added `AbortController` on the frontend so that an older search request can be cancelled when the user starts another search.



For example, if a user quickly searches:



```text

bat

batman

batman movie

```



the application can cancel the older request instead of unnecessarily waiting for all of them.



The backend also has a small in-memory cache for repeated requests.



The cache is currently kept for 5 minutes.



This helps avoid making the same external API request repeatedly.



\## Loading and Error Handling



I added different states for situations such as:



\* Data is loading

\* No results were found

\* The external API is unavailable

\* The request takes too long

\* Too many requests are made

\* An invalid show ID is requested

\* An invalid page is requested



This helps the user understand what is happening instead of seeing a blank screen.



\## Browse and Load More



The Browse Shows feature was added so that users are not limited to searching for a specific show.



The application loads shows page by page.



When the user clicks \*\*Load More Shows\*\*, another page is fetched and added to the existing results.



This makes it easier to continue exploring a larger number of shows.



\## Responsive Design



I also made the layout responsive.



The app adjusts to different screen sizes, including:



\* Desktop

\* Laptop

\* Tablet

\* Mobile



The movie cards automatically adjust depending on the available screen width.



I also handled long show titles and different poster sizes so that the cards don't break the layout.



\## Why I used a backend



I could have called TVMaze directly from React, but I decided to keep the external API calls in the Node.js backend.



This gives me more control over:



\* API errors

\* Response formatting

\* Caching

\* Request handling

\* Future changes to the API



It also keeps the frontend code cleaner.



\## Limitations



There are a few limitations in the current version.



\* The wishlist is stored only in the current browser.

\* Wishlist data is not shared between different devices.

\* The application depends on the TVMaze API.

\* The cache is stored in memory, so it is cleared when the backend restarts.

\* There is no user login system.

\* The current data is based on what TVMaze provides.



\## Future Improvements



If I continue developing this project, I would like to add:



\* User login and registration

\* Database-based wishlist

\* Wishlist synchronization between devices

\* More advanced filters

\* Better recommendations

\* Debounced search

\* Infinite scrolling

\* Automated tests

\* Better accessibility

\* More detailed movie/show information

\* Additional API providers



\## How to Run the Project



\### Backend



Open a terminal and go to the backend folder:



```bash

cd backend

```



Install the packages:



```bash

npm install

```



Start the backend:



```bash

node server.js

```



The backend will run on:



```text

http://localhost:5000

```



\### Frontend



Open another terminal and go to the frontend folder:



```bash

cd frontend

```



Install the packages:



```bash

npm install

```



Start the frontend:



```bash

npm run dev

```



The application will normally be available at:



```text

http://localhost:5173

```



\## AI Usage



I used AI tools during development to help me understand the assignment, work through coding issues, improve error handling, and review different implementation approaches.



I also used AI while debugging and improving parts of the frontend and backend.



I tested the application myself and made sure I understood the main parts of the code and how the frontend, backend, and external API work together.



\## What I Tested



I manually tested the main features of the application:



\* Search

\* Filters

\* Sorting

\* Browse Shows

\* Load More Shows

\* Show details

\* Add to wishlist

\* Remove from wishlist

\* Wishlist persistence

\* Loading states

\* Error states

\* No-results state

\* Responsive layout

\* Backend API

\* Repeated requests and caching

\* Rapid searches



\## Final Note



This project was built with a focus on keeping the application simple, responsive, and easy to understand while still covering the main requirements of the Trackzio assignment.



The project can also be extended further with authentication, a database, better recommendations, automated testing, and more advanced discovery features.




// const userarray = ["tushar", "shehab", "israfil"];

// document.addEventListener("DOMContentLoaded", () => {
//   const alluserElement = document.getElementById("alluser");
//   userarray.forEach((user) => {
//     const h1 = document.createElement("h1");
//     h1.textContent = user;
//     alluserElement.appendChild(h1);
//   });

//   let name = localStorage.getItem("name");

//   if (userarray.includes(name)) {
//     if (name.length > 0) {
//       const socket = io("http://192.168.10.116:5000", {
//         auth: {
//           token: name, // Replace 'YourUsername' with the actual username
//         },
//       });

//       socket.on("connect", () => {
//         console.log("Connected to the Socket.IO server");
//       });

//       function updateOnlineUsers(users) {
//         const alluserElement = document.getElementById("alluser");
//         const h1Elements = alluserElement.getElementsByTagName("h1");

//         for (let i = 0; i < h1Elements.length; i++) {
//           const user = h1Elements[i].textContent.trim();
//           const color = users.includes(user) ? "green" : "black";
//           h1Elements[i].style.color = color;
//         }
//       }

//       socket.on("updateOnlineUser", (users) => {
//         updateOnlineUsers(users);
//       });
//     } else {
//       alert("Name is required");
//     }
//   } else {
//     alert("This name is not valid");
//   }
// });

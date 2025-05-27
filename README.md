<p align="center">
  <img src="src/assets/images/EVOLUTION_Logo.svg" alt="Evolution Battleship Logo" width="135" style="vertical-align: middle; margin-right: 5px;"/><span style="vertical-align: middle; font-size: 2em; font-weight: bold;"> Battleship - Frontend</span>
</p>


## Description
This is a two-player game and each player has a 10x10 canvas and five ships to place, each of a different type:

- Destroyer (2 cells)
- Cruiser (3 cells)
- Submarine (3 cells)
- Battleship (4 cells)
- Carrier (5 cells)

A ship can be placed horizontally or vertically, but not diagonally.
In addition, no ships can be in adjacent cells on the board.

Once placed, the players can attack the other player's board by issuing coordinates. A player wins by being the first to take down all the ships on the other player's board.

This project is built with **React**, **Vite**, and **TypeScript**, and connects to a Scala-based backend.

➡️ For more details of the backend project, please check out: [Evolution Battleship Backend](https://github.com/gsa-Evolution/BE_Evolution_Battleship)
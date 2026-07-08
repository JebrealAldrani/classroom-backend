import express from "express"

const app = express();
const PORT = 8000

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Classroom API Run Successfully!")
})

 app.listen(PORT, () => {
     console.log("server is running successfully on port: ", PORT)

 })


INSERT INTO departments (code, name, description) VALUES ('ECS', 'Electronics & Communication', 'Circuits, signal processing telecom')

INSERT INTO subjects VALUES (1, 'CS', 'Data Structure', 'Algorithms, list and more')
(2, 'ECE', 'Signals', 'Signal processing telecom')
require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const Person = require("./models/person");

const app = express();

app.use(express.static("dist"));
app.use(express.json());
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :content"
  )
);

morgan.token("content", function (req, res) {
  return JSON.stringify(req.body);
});

app.get("/info", (request, response) => {
  Person.find({}).then((persons) => {
    const numberOfPersons = persons.length;
    const time = new Date();
    response.send(
      `Phonebook has info for ${numberOfPersons} people<br>${time}`
    );
  });
});

app.get("/api/persons", (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons);
  });
});
app.get("/api/persons/:id", (request, response,next) => {
  const id = request.params.id;
  Person.findById(id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
  // const person = persons.find((person) => person.id === id);
});

app.delete("/api/persons/:id", (request, response,next) => {
  const id = request.params.id;
  // persons = persons.filter((person) => person.id !== id);
  Person.findByIdAndDelete(id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const {  number } = request.body;

  Person.findById(request.params.id)
    .then((person) => {
      if (!person) {
        return response.status(404).end();
      }

      person.number = number;

      return person.save().then((updatedPerson) => {
        response.json(updatedPerson);
      });
    })
    .catch((error) => next(error));
});

app.post("/api/persons", (request, response,next) => {
  const body = request.body;
  // if (persons.some((person) => person.name === body.name)) {
  //   return response.status(409).json({ error: "name must be unique" });
  // }

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person.save().then((savedPerson) => {
    response.json(savedPerson);
  })
  .catch(error => next(error));
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

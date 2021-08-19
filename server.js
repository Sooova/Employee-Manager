const mysql = require('mysql2');
const inquirer = require('inquirer');
require("console.table");

const sqlConnection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    //please enter your password
    password:'pleaseEnterYourPasswordHere',
    database: 'employeesDB'
})

sqlConnection.connect(function (err) {
    if (err) {
        throw err;
    }

    console.log(`connected as id ${sqlConnection.threadId}`);
    console.log(`
Welcome to the Employee Manager`);
    initialQuestions();
})

function initialQuestions() {

    inquirer
      .prompt({
        type: "list",
        name: "task",
        message: "Would you like to do?",
        choices: [
          "View Employees",
          "Add Employee",
          "Remove Employees",
          "Add Role",
          "End"]
      })
      .then(function ({ task }) {
        switch (task) {
          case "View Employees":
            viewEmployee();
            break;
        
          case "Add Employee":
            addEmployee();
            break;
  
          case "Remove Employees":
            removeEmployeeSetup();
            break;
  
          case "Add Role":
            addRoleCritieria();
            break;
  
          case "End":
            sqlConnection.end();
            break;
        }
      });
    }

function viewEmployee() {
    var query =
      `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
    FROM employee e
    LEFT JOIN role r
      ON e.role_id = r.id
    LEFT JOIN department d
    ON d.id = r.department_id
    LEFT JOIN employee m
      ON m.id = e.manager_id`
  
    sqlConnection.query(query, function (err, res) {
      if (err) {
        throw err;
      } 
  
      console.table(res);
      initialQuestions();
    });
}

function addEmployee() {
    console.log("Inserting an employee!")

    var query =
      `SELECT r.id, r.title, r.salary 
        FROM role r`
  
    sqlConnection.query(query, function (err, res) {
      if (err) {
        throw err;
      }
  
      const roleChoices = res.map(({ id, title, salary }) => ({
        value: id, title: `${title}`, salary: `${salary}`
      }));
  
      console.table(res);
      employeeQuestions(roleChoices);
    });
}

function employeeQuestions(roleChoices) {
    inquirer
    .prompt([
      {
        type: "input",
        name: "first_name",
        message: "What is the employee's first name?"
      },
      {
        type: "input",
        name: "last_name",
        message: "What is the employee's last name?"
      },
      {
        type: "list",
        name: "roleId",
        message: "What is the employee's role?",
        choices: roleChoices
      },
    ])
    .then(function (promptAnswers) {
      console.log(promptAnswers);

      var query = `INSERT INTO employee SET ?`

      sqlConnection.query(query,
        {
          first_name: promptAnswers.first_name,
          last_name: promptAnswers.last_name,
          role_id: promptAnswers.roleId,
          manager_id: promptAnswers.managerId,
        },
        function (err, res) {
          if (err) {
            throw err;
          } 

          console.table(res);
          console.log('new Employee has been added');

          initialQuestions();
        });
    });
}

function removeEmployeeSetup() {
    console.log('test');
    console.log("Deleting an employee");

    var query =
      `SELECT e.id, e.first_name, e.last_name
        FROM employee e`
  
    sqlConnection.query(query, function (err, res) {
      if (err) {
          throw err;
      }
  
      const deletionCriteria = res.map(({ id, first_name, last_name }) => ({
        value: id, name: `${id} ${first_name} ${last_name}`
      }));
  
      console.table(res);
      completeRemoval(deletionCriteria);
    });
}

function completeRemoval(deletionCriteria) {
    
  inquirer
  .prompt([
    {
      type: "list",
      name: "employeeId",
      message: "Which employee do you want to remove?",
      choices: deletionCriteria
    }
  ])
  .then(function (answer) {

    var query = `DELETE FROM employee WHERE ?`;
    sqlConnection.query(query, { id: answer.employeeId }, function (err, res) {
      if (err) throw err;

      console.table(res);
      console.log(res.affectedRows + "Deleted!\n");

      initialQuestions();
    });
  });
}

function addRoleCritieria() {
    console.log('you are about to add a new role!');
    var query =
    `SELECT d.id, d.name, r.salary AS budget
    FROM employee e
    JOIN role r
    ON e.role_id = r.id
    JOIN department d
    ON d.id = r.department_id
    GROUP BY d.id, d.name`

  sqlConnection.query(query, function (err, res) {
    if (err) {
        throw err;
    }

    const addRoleChoices = res.map(({ id, name }) => ({
      value: id, name: `${id} ${name}`
    }));

    console.table(res);
    completeAddRole(addRoleChoices);
  });
}

function completeAddRole(addRoleChoices) {
    inquirer
    .prompt([
      {
        type: "input",
        name: "roleTitle",
        message: "What is the role title?"
      },
      {
        type: "input",
        name: "roleSalary",
        message: "What is the role Salary"
      },
      {
        type: "list",
        name: "departmentId",
        message: "Which department?",
        choices: addRoleChoices
      },
    ])
    .then(function (answer) {

      var query = `INSERT INTO role SET ?`

      sqlConnection.query(query, {
        title: answer.title,
        salary: answer.salary,
        department_id: answer.departmentId
      },
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log("Role Inserted!");

          initialQuestions();
        });

    });
}


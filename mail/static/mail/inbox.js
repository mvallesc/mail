document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#email-details").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-details").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  /* ********************************************************************************************* */

  // Realizar una solicitud GET a la API para los correos del buzón especificado
  fetch(`/emails/${mailbox}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    })
    .then((emails) => {
      // Renderizar los correos del buzón seleccionado
      render_emails(emails);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

/* ********************************************************************************************* */

function render_emails(emails) {
  const emailsView = document.querySelector("#emails-view");

  // Crear un nuevo div que contendrá los correos
  const mailboxContainer = document.createElement("div");

  // Iterar sobre cada correo y crear un div para cada uno
  emails.forEach((email) => {
    const emailBox = document.createElement("div");
    emailBox.classList.add("email-box");

    // Agregar un borde al div del correo y un margen
    emailBox.style.border = "1px solid black";
    emailBox.style.margin = "10px";

    // Aplicar estilos diferentes para correos leídos y no leídos
    if (email.read) {
      emailBox.style.backgroundColor = "lightgray"; // Fondo gris para correos leídos
    } else {
      emailBox.style.backgroundColor = "white"; // Fondo blanco para correos no leídos
    }

    // Contenido del div del correo
    if (email.sender === request_user_email) {
      emailBox.innerHTML = `
          <p>To: ${email.recipients}</p>
          <p>Subject: ${email.subject}</p>
          <p>Timestamp: ${email.timestamp}</p>
        `;
    } else {
      emailBox.innerHTML = `
          <p>From: ${email.sender}</p>
          <p>Subject: ${email.subject}</p>
          <p>Timestamp: ${email.timestamp}</p>
        `;
    }

    // Agregar un evento clic a cada correo electrónico
    emailBox.addEventListener("click", () => {
      load_email(email.id);
      // Mostrar los detalles del correo electrónico y ocultar otros elementos
      document.querySelector("#emails-view").style.display = "none";
      document.querySelector("#compose-view").style.display = "none";
      document.querySelector("#email-details").style.display = "block";
    });

    // Agregar el div del correo al contenedor del buzón
    mailboxContainer.appendChild(emailBox);
  });

  // Agregar el contenedor del buzón a la vista de correos
  emailsView.appendChild(mailboxContainer);
}

document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelector("#compose-form")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Evita la recarga de la página al enviar el formulario

      // Obtener los valores directamente de los campos del formulario
      const recipients = document.querySelector("#compose-recipients").value;
      const subject = document.querySelector("#compose-subject").value;
      const body = document.querySelector("#compose-body").value;

      // Realizar una solicitud AJAX para enviar el correo
      fetch("/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Manejar la respuesta del servidor
          console.log(data);

          // Si el correo se envió con éxito, carga la bandeja de salida del usuario
          if (data.message === "Email sent successfully.") {
            load_mailbox("sent");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
});

function load_email(email_id) {
  // Realizar una solicitud GET a la API para el correo específico
  fetch(`/emails/${email_id}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    })
    .then((email) => {
      // Marcar el correo electrónico como leído
      mark_email_as_read(email_id);
      // Renderizar los detalles del correo
      render_email(email);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function render_email(email) {
  // Obtener el contenedor donde se mostrarán los detalles del correo electrónico
  const emailDetails = document.querySelector("#email-details");

  // Borrar el contenido anterior
  emailDetails.innerHTML = "";

  // Configurar el contenido del div de detalles del correo electrónico
  emailDetails.innerHTML = `
  <p><strong>From:</strong> ${email.sender}</p>
  <p><strong>To:</strong> ${email.recipients}</p>
  <p><strong>Subject:</strong> ${email.subject}</p>
  <p><strong>Timestamp:</strong> ${email.timestamp}</p>`;

  // Agregar el botón de archivado o desarchivado dependiendo del estado del correo y el tipo de bandeja
  const archiveButton = document.createElement("button");
  archiveButton.classList.add("btn", "btn-sm", "btn-primary");
  if (email.sender !== request_user_email && email.archived === false) {
    archiveButton.textContent = "Archive";
    // Agregar el botón al div de detalles del correo electrónico
    emailDetails.appendChild(archiveButton);
    archiveButton.addEventListener("click", () =>
      handleArchive(email.id, true)
    );
  } else if (email.sender !== request_user_email && email.archived) {
    archiveButton.textContent = "Unarchive";
    emailDetails.appendChild(archiveButton);
    archiveButton.addEventListener("click", () =>
      handleArchive(email.id, false)
    );
  }

  // Agregar el botón "Reply"
  const replyButton = document.createElement("button");
  replyButton.classList.add("btn", "btn-sm", "btn-primary");
  replyButton.textContent = "Reply";
  emailDetails.appendChild(replyButton);
  replyButton.addEventListener("click", () => replyToEmail(email));

  // Agregar un separador <hr>
  const hrSeparator = document.createElement("hr");
  emailDetails.appendChild(hrSeparator);

  // Crear un elemento de párrafo para el cuerpo del correo y agregarlo al contenedor de detalles
  const bodyParagraph = document.createElement("p");
  bodyParagraph.textContent = email.body;
  emailDetails.appendChild(bodyParagraph);
}

function mark_email_as_read(email_id) {
  // Realizar una solicitud PUT a la API para marcar el correo como leído
  fetch(`/emails/${email_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      read: true,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function handleArchive(emailId, archive) {
  // Realizar una solicitud PUT a la API para archivar o desarchivar el correo
  fetch(`/emails/${emailId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      archived: archive,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      load_mailbox("inbox");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function replyToEmail(email) {
  // Mostrar el formulario de composición
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#email-details").style.display = "none";

  // Prellenar los campos del formulario con los datos del correo original
  document.querySelector("#compose-recipients").value = email.sender;
  document.querySelector("#compose-subject").value = addReplyPrefix(
    email.subject
  );
  document.querySelector("#compose-body").value = generateReplyBody(email);
}

function addReplyPrefix(subject) {
  // Agregar "Re:" al asunto si no comienza con "Re:"
  if (!subject.startsWith("Re: ")) {
    return `Re: ${subject}`;
  }
  return subject;
}

function generateReplyBody(email) {
  // Generar el cuerpo del correo de respuesta
  return `On ${email.timestamp} ${email.sender} wrote:\n${email.body} \n`;
}

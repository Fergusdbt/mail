document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Listen for submission of compose email form
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id) {

  // Show the read view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Fetch email by id
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

      // Display email contents
      document.querySelector('#read-view').innerHTML = `
      <div><strong>From: </strong>${email.sender}</div>
      <div><strong>To: </strong>${email.recipients}</div>
      <div><strong>Subject: </strong>${email.subject}</div>
      <div><strong>Sent: </strong>${email.timestamp}</div>
      <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
      <div id="archive"></div>
      <hr>
      <p>${email.body}</p>
      `;

      // Add click event listener to reply button
      document.querySelector('#reply').addEventListener('click', () => {
        compose_email();

        // Populate composition fields
        document.querySelector('#compose-recipients').value = `${email.sender}`;
        let subject = email.subject;
        let word = subject.split(' ',1)[0];
        if (word.toLowerCase() != 're:') {
          subject = 'Re: ' + subject
        };
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      });

      // Mark email as read
      if (!email.read) {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      };

      // Add archive button and assign click event listener
      const archive = document.createElement('button');
      archive.className = 'btn btn-sm btn-outline-primary';
      archive.innerHTML = email.archived ? 'Unarchive' : 'Archive';
      archive.addEventListener('click', () => {

        // Toggle archived property
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived
          })
        })
        .then(() => load_mailbox('inbox'))
      });
      document.querySelector('#archive').append(archive);
  });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails by mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Display preview for each email in mailbox
    emails.forEach(email => {
      const preview = document.createElement('div');
      preview.className = 'container-fluid';
      preview.id = 'preview';
      preview.innerHTML = `
        <div class="row">
          <div class="col-3">
            <strong>From:</strong> ${email.sender}
          </div>
          <div class="col-6">
            <strong>Subject:</strong> ${email.subject}
          </div>
          <div class="col-3">
            ${email.timestamp}
          </div>
        </div>
      `;

      // Assign CSS styling, add click event listener and append
      preview.className = email.read ? 'read' : 'unread';
      preview.addEventListener('click', () => view_email(email.id));
      document.querySelector('#emails-view').append(preview);
    });
  });
}

function send_email() {

  // Prevent default form handling
  event.preventDefault();

  // Store values of compose form fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send email and load 'sent' mailbox
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {

    // Clear previous messages and display new error message if email not sent
    if (result.error) {
      document.querySelector('#error').innerHTML = '';
      document.querySelector('#error').innerHTML = `${result.error}`;
    };

    // Load sent mailbox if email send successfully
    if (result.message) {
      load_mailbox('sent')
    };
  });
}

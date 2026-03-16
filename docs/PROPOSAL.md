- Recon: Attacker discovers sensitive directories (/backup/, /admin/, /internal/exports/) via robots.txt.

Initial Access
- Vector 1 – IDOR: Accessing /internal/exports/users.csv leaks developer credentials → attacker SSHs into the server as devops.

Hint 1: look at robots.txt
Hint 2: check comment in source code file (“// TODO: remove debug exports at /internal/exports/users.csv” )

- Vector 2 – React RCE: Exploit CVE-2025-55182 in react@19.1.0 to achieve RCE via Server Actions, gaining a reverse shell as www-data with access to /var/www and .env.

Hint 1: Banner that warns incoming users that the “current site” is deprecated soon due to react@19.1.0 and next@15.1.0 (give exact version pinpointed to the CVE) being outdated and recommends them to navigate to use the new site ASAP. The new site link can lead to a “still under construction” webpage
Hint 2: Consider CVEs

-  Vector 3 – SSRF: Webhook testing feature allows SSRF to 127.0.0.1:9000, exposing an ADMIN_TOKEN used to create a new analyst web account.

Hint: Documentation explains “We send a sample event to the URL you provide and show you the response. Our backend will ping your server to verify connectivity"

Horizontal Esc Path 1: .env reveals reused devops SSH password, enabling attacker to pivot from www-data → SSH as devops.

Hint 1: Take a closer look at how the web server is configured. Sometimes configuration files contain information that wasn’t meant to be publicly accessible. If you come across any credentials, consider whether they might also work elsewhere in the system.

Horizontal Esc Path 2: From www-data, attacker directly calls the internal Admin API and promotes the analyst account to admin, gaining full SaaS application control.

Hint 2: Look at how the application manages user roles through its internal API. If the attacker already has a normal account, think about whether they could directly call an internal endpoint that modifies user roles or permissions without proper authorization checks.

Vertical Privilege Escalation
- Vector 1 - Wildcard Injection: A root-executed backup process is discovered using tar *. The attacker creates specially crafted filenames that cause tar to execute arbitrary commands when the cron job runs.

Hint: The backup process archives files from a directory that is writable by the current user. The command uses "tar * ", which allows filenames to be interpreted as command-line arguments.

- Vector 2 - PATH Privilege Esc:  A misconfigured script executes system utilities without absolute paths, enabling PATH privilege escalation by placing a malicious binary earlier in the PATH.

Hint: A privileged script or binary executes system utilities as part of its operation. Inspection of the script reveals that some commands are executed without specifying their absolute paths.

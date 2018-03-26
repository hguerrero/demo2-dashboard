# example-ws
Example showing and HTML page being updated via an AMQP subscription over WebSockets

## Contents of the project

  * `index.html` - This is ths actual example web page with a script to receive updates via an AMQP subscription.
  * `config/qdrouterd.conf` - A basic configuration for Qpid Dispatch Router to provide WebSocket access for the example.
  * `datasource/source.py` - An example data source that feeds the subscription with rapidly updating data.

## Dependencies

To run this example, the following packages are required:

  * rhea (AMQP client for JavaScript) - `npm install` from the project directory.
  * qpid-dispatch-router (available in Fedora, EPEL, RHEL)
  * python-qpid-proton

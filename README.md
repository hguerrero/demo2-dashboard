# Demo 2 Dashboard

This is the cloud traffic visualization for demo 2 of the Red Hat Summit keynote.

## Quick-start

    sudo dnf install qpid-dispatch-router python-qpid-proton
    npm install
    npm start

## Contents of the project

  * `index.html` - This is the actual example web page with a script to receive updates via an AMQP subscription.
  * `config/qdrouterd.conf` - A basic configuration for Qpid Dispatch Router to provide WebSocket access for the example.  An installed router can be run with the command `/usr/sbin/qdrouterd -c config/qdrouterd.conf`
  * `datasource/source.py` - An example data source that feeds the subscription with rapidly updating data.

## Dependencies

To run this example, the following packages are required:

  * rhea (AMQP client for JavaScript) - `npm install` from the project directory.
  * qpid-dispatch-router (available in Fedora, EPEL, RHEL)
  * python-qpid-proton

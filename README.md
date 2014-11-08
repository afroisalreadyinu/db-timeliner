db-timeliner is a simple tool for visualising the changes in one or
more database rows.

Usage
-----

- Install the python app by running `python setup.py develop` in a
  virtualenv.

- Download Snap.svg from [the project's Github
  page](https://github.com/adobe-webplatform/Snap.svg/releases) into
  the `js` directory.

- Run `db-timeliner db-uri table_name_1=id1 table_name2=id2 ...`,
  where `db-uri` is a database URI in the RFC-1738 format, and the
  rest of the arguments specify the columns to be picked by table name
  and ID.

- Open the resulting file `graph.html` in a browser.
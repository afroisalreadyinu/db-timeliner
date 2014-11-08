import os, sys
import psycopg2
import json
from string import Template
from datetime import datetime
from decimal import Decimal

HISTORY_POSTFIX = '_history'
DATE_COL = 'updated'

def clean(row):
    newrow = []
    for cell in row:
        if isinstance(cell, datetime):
            cell = cell.isoformat()
        elif isinstance(cell, Decimal):
            cell = str(cell)
        newrow.append(cell)
    return newrow

def rows(cursor, table_name, _id):
    history_table = table_name + HISTORY_POSTFIX
    cursor.execute(
        """SELECT * FROM "%s" WHERE id=%d ORDER BY %s ASC;""" % (
            history_table, _id, DATE_COL))
    results = cursor.fetchall()
    cursor.execute("""SELECT * FROM "%s" WHERE id=%d;""" % (table_name, _id))
    results.append(cursor.fetchone())
    column_names = [desc[0] for desc in cursor.description]
    assert any(results), "{} with id {} could not be found".format(table_name, _id)
    row_list = []
    for row in results:
        row_data = dict(zip(column_names, clean(row)))
        row_data['transition'] = False
        row_list.append(row_data)
    return row_list


def diff(older_row, newer_row, excluded_columns=None):
    if excluded_columns is None:
        excluded_columns = [HISTORY_POSTFIX, DATE_COL, 'version']
    keys = list(set(older_row.keys()) - set(excluded_columns))
    difference = {'transition': True, 'happened': newer_row['updated']}
    difference['changes'] = {}
    for key in keys:
        if older_row[key] != newer_row[key]:
            difference['changes'][key] = [older_row[key], newer_row[key]]
    return difference


USAGE = """Usage:
%s db-uri table_name_1:id1 table_name2:id2 ..."""

def main():
    if len(sys.argv) < 3:
        print USAGE % sys.argv[0]
    db_uri = sys.argv[1]
    table_specs = sys.argv[2:]
    conn = psycopg2.connect(db_uri)
    cursor = conn.cursor()
    table_data = {}
    for table_spec in table_specs:
        table_name, _id = table_spec.split("=")
        data_rows = rows(cursor, table_name, int(_id))
        table_seq = data_rows[:1]
        for first_state, second_state in zip(data_rows[:-1], data_rows[1:]):
            table_seq.append(diff(first_state, second_state))
            table_seq.append(second_state)
        table_data[table_name] = table_seq
    with open('graph.html.tmpl', 'r') as graph_file:
        graph_tmpl = graph_file.read()
    page = Template(graph_tmpl).substitute(transitions=json.dumps(table_data))
    with open('graph.html', 'w') as graph_page:
        graph_page.write(page)
    print("Graph saved in graph.html")

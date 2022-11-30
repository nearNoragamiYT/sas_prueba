<?php

namespace Utilerias\SQLBundle\Model;

use Utilerias\PostgreSQLBundle\v9\PGSQLClient;

class SQLModel
{

    protected $PGModel;
    private $schema;

    public function __construct($db_data = NULL)
    {
        $this->PGModel = new PGSQLClient($db_data);
        $this->schema = "AE";
    }

    public function executeQuery($qry)
    {
        return $this->PGModel->execQueryString($qry);
    }

    public function selectFromTable($table, $fields = array(), $where = array(), $order = array())
    {
        $qry = 'SELECT';
        $qry .= $this->buildSelectFields($fields);
        $qry .= ' FROM';
        $qry .= ' "' . $this->schema . '"."' . $table . '" ';
        $qry .= $this->buildWhere($where);
        $qry .= $this->buildOrderBy($order);
        return $this->PGModel->execQueryString($qry);
    }

    public function insertIntoTable($table, $values, $primaryKey = "")
    {
        $cols = $this->getColumnsValues($values);
        $qry = ' INSERT INTO "' . $this->schema . '"."' . $table . '"';
        $qry .= ' (' . $cols['columns'] . ') ';
        $qry .= ' VALUES(' . $cols['values'] . ')';
        if ($primaryKey != "") {
            if (substr($primaryKey, 0, 1) == "'" && substr($primaryKey, -1) == "'") {
                $primaryKey = "'" . substr($primaryKey, 1, -1) . "'";
            }
            $qry .= ' RETURNING "' . $primaryKey . '"';
        }
        return $this->PGModel->execQueryString($qry);
    }

    public function updateFromTable($table, $values, $where = array(), $primaryKey = "")
    {
        $qry = 'UPDATE "' . $this->schema . '"."' . $table . '" SET ';
        $qry .= $this->getValuesToUpdate($values);
        $qry .= $this->buildWhere($where);
        if ($primaryKey != "") {
            if (substr($primaryKey, 0, 1) == "'" && substr($primaryKey, -1) == "'") {
                $primaryKey = "'" . substr($primaryKey, 1, -1) . "'";
            }
            $qry .= ' RETURNING "' . $primaryKey . '"';
        }

        return $this->PGModel->execQueryString($qry);
    }

    public function deleteFromTable($table, $where = array())
    {
        $qry = 'DELETE FROM "' . $this->schema . '"."' . $table . '" ';
        $qry .= $this->buildWhere($where);
        return $this->PGModel->execQueryString($qry);
    }

    private function buildSelectFields($fields)
    {
        if (!(is_array($fields) && count($fields) > 0)) {
            return " * ";
        }

        $qry = " ";

        foreach ($fields as $key => $value) {
            if (substr($value, 0, 1) == "'" && substr($value, -1) == "'") {
                $value = "'" . substr($value, 1, -1) . "'";
            }
            $qry .= '"' . $value . '"';
            if (next($fields)) {
                $qry .= ', ';
            }
        }

        return $qry;
    }

    public function buildWhere($where)
    {
        if (!(is_array($where) && count($where) > 0)) {
            return "";
        }

        $qry = " WHERE";
        $qry .= $this->buildParameters($where);
        return $qry;
    }

    public function buildOrderBy($order)
    {
        if (!(is_array($order) && count($order) > 0)) {
            return "";
        }

        $qry = " ORDER BY";
        $qry .= $this->buildParametersOrderBy($order);
        return $qry;
    }

    private function buildParametersOrderBy($param)
    {
        if (!(is_array($param) && count($param) > 0)) {
            return "";
        }

        $qry_param = " ";
        foreach ($param as $key => $value) {
            $qry_param .= '"' . str_replace('"', '', $key) . '"';
            if (substr($value, 0, 1) == "'" && substr($value, -1) == "'") {
                $value = "'" . substr($value, 1, -1) . "'";
            }
            $qry_param .= ($value == "") ? " IS NULL " : " " . $value;
            if (next($param)) {
                $qry_param .= ', ';
            }
        }

        return $qry_param;
    }

    private function buildParameters($param)
    {
        if (!(is_array($param) && count($param) > 0)) {
            return "";
        }

        $qry_param = " ";
        foreach ($param as $key => $value) {
            /* Si tiene parentesis el key, lo dejamos como viene */
            if (strpos($key, "(") && strpos($key, ")") || strpos($key, ".")) {
                $qry_param .= $key;
            } else {
                $qry_param .= '"' . str_replace('"', '', $key) . '"';
            }

            /* Si el valor tiene operadores relacionales, construimos la condicion */
            $operator = "=";
            if ((is_array($value) && count($value) > 0)) {
                $operator = $value['operator'];
                $value = $value['value'];
            }

            if (substr($value, 0, 1) == "'" && substr($value, -1) == "'") {
                $value = "'" . substr($value, 1, -1) . "'";
            }
            $qry_param .= ($value == "") ? " IS NULL " : $operator . $value;

            if (next($param)) {
                $qry_param .= ' AND ';
            }
        }
        return $qry_param;
    }

    /*private function buildParametersCopy($param) {
        if (!(is_array($param) && count($param) > 0)) {
            return "";
        }

        $qry_param = " ";
        foreach ($param as $key => $value) {
            $qry_param .= $this->buildValuesString($key, $value);
            if (next($param)) {
                $qry_param.= ' AND ';
            }
        }
        return $qry_param;
    }

    private function buildValuesString($field, $value) {
        $field = $this->formatFieldString($field);
        $operator = " = ";
        if (!is_array($value)) {
            return $field . $this->formatValueString($operator, $value);
        }

        if (isset($value['operator']) && isset($value['value'])) {
            return $field . $this->formatValueString($value['operator'], $value['value']);
        }

        $qry = "(";
        foreach ($value as $key => $val) {
            $qry .= $this->buildValuesString($field, $val);
            if (next($value)) {
                $qry.= ' OR ';
            }
        }
        $qry .= ")";
        return $qry;
    }

    private function formatFieldString($field) {
        if (!(strpos($key, "(") && strpos($key, ")"))) {
            $field.= '"' . str_replace('"', '', $key) . '"';
        }
        return $field;
    }

    private function formatValueString($operator, $value) {
        if (!(substr($value, 0, 1) == "'" && substr($value, -1) == "'")) {
            $value = "'" . substr($value, 1, -1) . "'";
        }
        return ($value == "") ? " IS NULL " : $operator . $value;
    }*/

    private function getColumnsValues($columns = array())
    {
        if (!(is_array($columns) && count($columns) > 0)) {
            return array("columns" => "", "values" => "");
        }

        $cols = "";
        $vals = "";
        foreach ($columns as $key => $value) {
            if ($value != "") {
                $cols .= '"' . $key . '", ';
                $vals .= "" . $value . ", ";
            }
        }
        $result = array(
            "columns" => substr($cols, 0, (strlen($cols) - 2)),
            "values" => substr($vals, 0, (strlen($vals) - 2))
        );
        return $result;
    }

    private function getValuesToUpdate($columns = array())
    {
        if (!(is_array($columns) && count($columns) > 0)) {
            return "";
        }

        $vals = "";
        foreach ($columns as $key => $value) {
            $value = (trim($value) != "") ? trim($value) : "null";
            $vals .= " \"" . $key . "\"=" . $value . ", ";
        }
        return substr($vals, 0, (strlen($vals) - 2));
    }

    public function setSchema($schema)
    {
        $this->schema = $schema;
    }
}

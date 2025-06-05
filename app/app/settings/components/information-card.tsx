import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { QUERIES } from '@/lib/tanstack-queries';
import { useQuery } from '@tanstack/react-query';

export const InformationCard = () => {
  const { data: deviceId } = useQuery(QUERIES.config.getUserConfig('deviceId'));

  const tableData: Record<string, string> = {
    'Device ID': deviceId?.value ?? '',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {Object.entries(tableData).map(([name, value]) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell>{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody } from '@/components/ui/table';

export const InformationCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody></TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

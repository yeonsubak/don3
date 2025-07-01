import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import com.don3.sync.domain.auth.enums.Algorithm

@Converter(autoApply = true)
class AlgorithmConverter : AttributeConverter<Algorithm, String> {
    override fun convertToDatabaseColumn(attribute: Algorithm): String =
        attribute.dbValue

    override fun convertToEntityAttribute(dbData: String): Algorithm =
        Algorithm.fromDb(dbData)
}

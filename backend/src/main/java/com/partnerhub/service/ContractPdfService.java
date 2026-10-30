package com.partnerhub.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.partnerhub.domain.entity.Broker;
import com.partnerhub.domain.entity.BrokerBankAccount;
import com.partnerhub.domain.entity.BrokerContract;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;

@Service
public class ContractPdfService {

    private static final DateTimeFormatter UTC_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss 'UTC'").withZone(ZoneOffset.UTC);

    public String buildContractTerms(Broker broker, BrokerBankAccount bank, String contractNumber) {
        String docLabel = broker.getPersonType().name().equals("PJ") ? "CNPJ" : "CPF";
        String susepInfo = (broker.getSusepCode() != null && !broker.getSusepCode().isBlank())
                ? broker.getSusepCode()
                : "Isento / Em Homologação";
        String pixInfo = (bank != null && bank.getPixKey() != null && !bank.getPixKey().isBlank())
                ? bank.getPixKeyType() + " - " + bank.getPixKey()
                : "Liquidação via TED Bancária";

        return String.format("""
                INSTRUMENTO PARTICULAR DE PARCERIA COMERCIAL E COMISSIONAMENTO (%s)

                Pelo presente instrumento digital de adesão:

                1. CONTRATANTE (PLATAFORMA): PARTNER HUB ADMINISTRADORA E TECNOLOGIA LTDA, inscrita no CNPJ sob nº 48.910.220/0001-18, operadora da plataforma SaaS Partner Hub.

                2. PARCEIRO CORRETORA / CORRETOR: %s, modalidade %s, inscrito(a) no %s sob nº %s, Registro SUSEP: %s, E-mail oficial de notificações: %s, Telefone: %s.

                3. CONTA BANCÁRIA VINCULADA PARA LIQUIDAÇÃO DE COMISSÕES:
                   • Instituição Financeira: %s - %s
                   • Agência: %s | Conta: %s (%s)
                   • Chave Pix Cadastrada: %s

                CLÁUSULA PRIMEIRA - DO OBJETO
                O presente contrato regula o credenciamento do PARCEIRO na plataforma Partner Hub para intermediação comercial de planos de saúde, odontológicos e benefícios estipulados pelas operadoras integradas.

                CLÁUSULA SEGUNDA - DO AGENCIAMENTO E COMISSÃO RECORRENTE
                As porcentagens de agenciamento (parcelas iniciais) e vitalício/recorrência (por vida ativa adimplente) serão apuradas eletronicamente pelo Motor de Comissionamento conforme a tabela vigente de cada operadora e produto.

                CLÁUSULA TERCEIRA - DA OBRIGAÇÃO FISCAL (EMISSÃO DE NFS-e) E LIQUIDAÇÃO VIA ASAAS
                Para parceiros Pessoa Jurídica (PJ), a liberação do lote financeiro via Pix/TED está estritamente condicionada ao upload e validação prévia da respectiva Nota Fiscal de Serviços Eletrônica (NFS-e) no portal Partner Hub.

                CLÁUSULA QUARTA - DA INADIMPLÊNCIA E ESTORNO (CLAWBACK)
                Em caso de cancelamento precoce, fraude ou inadimplência do beneficiário durante o período de carência contratual da operadora, o PARCEIRO autoriza a compensação automática (clawback) do respectivo débito nos fechamentos subsequentes.

                CLÁUSULA QUINTA - DA ASSINATURA ELETRÔNICA E VALIDADE JURÍDICA (MP 2.200-2/2001)
                As partes reconhecem a plena validade jurídica deste contrato celebrado mediante aceite eletrônico (Click-to-Sign), cuja integridade e autoria são garantidas por resumo criptográfico SHA-256, registro de endereço IP, User-Agent e carimbo de tempo UTC.
                """,
                contractNumber,
                broker.getName().toUpperCase(),
                broker.getPersonType().name(),
                docLabel,
                broker.getDocumentNumber(),
                susepInfo,
                broker.getEmail(),
                broker.getPhone(),
                bank != null ? bank.getBankCode() : "---",
                bank != null ? bank.getBankName() : "---",
                bank != null ? bank.getAgency() : "---",
                bank != null ? bank.getAccountNumber() : "---",
                bank != null ? bank.getAccountType().name() : "---",
                pixInfo
        );
    }

    public String computeSha256(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Erro ao calcular hash SHA-256 do contrato", e);
        }
    }

    public String computeSha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Erro ao calcular hash SHA-256 do arquivo", e);
        }
    }

    public byte[] generateContractPdf(Broker broker) {
        BrokerContract contract = broker.getContract();
        BrokerBankAccount bank = broker.getBankAccounts().isEmpty() ? null : broker.getBankAccounts().get(0);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 42, 42, 42, 42);
            PdfWriter.getInstance(document, out);
            document.open();

            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, new Color(79, 70, 229));
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(15, 23, 42));
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(100, 116, 139));
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, new Color(30, 41, 59));
            Font monoFont = FontFactory.getFont(FontFactory.COURIER, 8.5f, new Color(15, 23, 42));
            Font badgeSignedFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(5, 150, 105));
            Font badgePendingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(217, 119, 6));

            // Cabeçalho
            Paragraph headerBrand = new Paragraph("PARTNER HUB • GESTÃO DE COMISSIONAMENTO", brandFont);
            document.add(headerBrand);

            Paragraph headerSub = new Paragraph(
                    "Contrato Digital de Parceria Comercial • Nº " + contract.getContractNumber() + " • Versão " + contract.getContractVersion(),
                    subtitleFont
            );
            headerSub.setSpacingAfter(14f);
            document.add(headerSub);

            // Quadro Resumo do Parceiro
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(14f);

            addMetaCell(summaryTable, "Parceiro / Razão Social:", broker.getName(), subtitleFont, titleFont);
            addMetaCell(summaryTable, "CPF / CNPJ:", broker.getDocumentNumber() + " (" + broker.getPersonType() + ")", subtitleFont, bodyFont);
            addMetaCell(summaryTable, "E-mail Oficial:", broker.getEmail(), subtitleFont, bodyFont);
            addMetaCell(summaryTable, "Telefone / SUSEP:", broker.getPhone() + " | SUSEP: " + (broker.getSusepCode() != null ? broker.getSusepCode() : "N/A"), subtitleFont, bodyFont);
            if (bank != null) {
                addMetaCell(summaryTable, "Domicílio Bancário:", bank.getBankCode() + " - " + bank.getBankName() + " (Ag " + bank.getAgency() + " / CC " + bank.getAccountNumber() + ")", subtitleFont, bodyFont);
                addMetaCell(summaryTable, "Chave Pix Liquidação:", bank.getPixKey() != null ? bank.getPixKeyType() + ": " + bank.getPixKey() : "Não informada", subtitleFont, bodyFont);
            }
            document.add(summaryTable);

            // Corpo do Contrato
            Paragraph termsParagraph = new Paragraph(contract.getTermsText(), bodyFont);
            termsParagraph.setLeading(14f);
            termsParagraph.setSpacingAfter(18f);
            document.add(termsParagraph);

            // Bloco de Auditoria Criptográfica Click-to-Sign
            PdfPTable auditTable = new PdfPTable(1);
            auditTable.setWidthPercentage(100);
            PdfPCell auditCell = new PdfPCell();
            auditCell.setPadding(12f);
            auditCell.setBackgroundColor(new Color(248, 250, 252));
            auditCell.setBorderColor(Boolean.TRUE.equals(contract.getSigned()) ? new Color(167, 243, 208) : new Color(253, 230, 138));
            auditCell.setBorderWidth(1.2f);

            if (Boolean.TRUE.equals(contract.getSigned())) {
                auditCell.addElement(new Paragraph("CERTIFICADO DE ASSINATURA ELETRÔNICA (CLICK-TO-SIGN VALIDADO)", badgeSignedFont));
                auditCell.addElement(new Paragraph("Signatário: " + contract.getSignerName() + " (" + contract.getSignerDocument() + ")", bodyFont));
                auditCell.addElement(new Paragraph("Carimbo de Tempo UTC: " + (contract.getSignedAt() != null ? UTC_FORMATTER.format(contract.getSignedAt()) : "N/A"), bodyFont));
                auditCell.addElement(new Paragraph("Endereço IP de Origem: " + contract.getSignerIp(), monoFont));
                auditCell.addElement(new Paragraph("User-Agent: " + contract.getSignerUserAgent(), monoFont));
                auditCell.addElement(new Paragraph("Hash SHA-256 do Contrato: " + contract.getDocumentHashSha256(), monoFont));
            } else {
                auditCell.addElement(new Paragraph("MINUTA AGUARDANDO ACEITE DIGITAL (CLICK-TO-SIGN)", badgePendingFont));
                auditCell.addElement(new Paragraph("Hash SHA-256 da Minuta Original: " + contract.getDocumentHashSha256(), monoFont));
            }

            auditTable.addCell(auditCell);
            document.add(auditTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao gerar PDF do contrato", e);
        }
    }

    private void addMetaCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(7f);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.addElement(new Paragraph(label, labelFont));
        cell.addElement(new Paragraph(value != null ? value : "-", valueFont));
        table.addCell(cell);
    }
}

